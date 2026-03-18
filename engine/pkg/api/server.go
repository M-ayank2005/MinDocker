package api

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/creack/pty"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/minidock/engine/pkg/container"
	"github.com/minidock/engine/pkg/registry"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type ContainerState struct {
	container.Container
	PtyFile *os.File `json:"-"`
}

var (
	stateMutex sync.Mutex
	containers = make(map[string]*ContainerState)
)

func StartServer(port int) {
	r := gin.Default()
	r.Use(cors.Default())

	r.GET("/api/images", func(c *gin.Context) {
		imagesDir := filepath.Join(container.BaseDir, "images")
		entries, err := os.ReadDir(imagesDir)
		if err != nil {
			c.JSON(200, []interface{}{})
			return
		}
		var list []map[string]string
		for _, e := range entries {
			if e.IsDir() {
				// Revert _ to : for UI display
				imageName := strings.ReplaceAll(e.Name(), "_", ":")
				list = append(list, map[string]string{
					"id":      imageName,
					"repo":    imageName,
					"tag":     "latest",
					"size":    "Filesystem",
					"created": "Downloaded",
				})
			}
		}
		c.JSON(200, list)
	})

	r.POST("/api/images/pull", func(c *gin.Context) {
		var req struct {
			Image string `json:"image"`
		}
		if err := c.BindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}

		safeImageRef := strings.ReplaceAll(req.Image, ":", "_")
		dest := filepath.Join(container.BaseDir, "images", safeImageRef)
		err := registry.PullImage(req.Image, dest)
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		c.JSON(200, gin.H{"status": "pulled", "image": req.Image})
	})

	r.DELETE("/api/images/:id", func(c *gin.Context) {
		id := c.Param("id")
		safeImageRef := strings.ReplaceAll(id, ":", "_")
		dest := filepath.Join(container.BaseDir, "images", safeImageRef)
		os.RemoveAll(dest)
		c.JSON(200, gin.H{"status": "deleted"})
	})

	r.GET("/api/containers", func(c *gin.Context) {
		stateMutex.Lock()
		defer stateMutex.Unlock()
		list := make([]interface{}, 0)
		for _, v := range containers {
			list = append(list, v)
		}
		c.JSON(200, list)
	})

	r.POST("/api/containers/run", func(c *gin.Context) {
		var req struct {
			Image   string `json:"image"`
			Command string `json:"command"`
		}
		if err := c.BindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}

		// Auto pull logic
		safeImageRef := strings.ReplaceAll(req.Image, ":", "_")
		imageDir := filepath.Join(container.BaseDir, "images", safeImageRef)
		if _, err := os.Stat(imageDir); os.IsNotExist(err) {
			err = registry.PullImage(req.Image, imageDir)
			if err != nil {
				c.JSON(500, gin.H{"error": "Auto-pull failed: " + err.Error()})
				return
			}
		}

		con, cmd, err := container.PrepareContainer(req.Image, req.Command)
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}

		ptyFile, err := pty.Start(cmd)
		if err != nil {
			c.JSON(500, gin.H{"error": "PTY start failed"})
			return
		}

		go func() {
			cmd.Wait()
			stateMutex.Lock()
			if cState, ok := containers[con.ID]; ok {
				cState.Status = "Exited"
			}
			stateMutex.Unlock()
		}()

		stateMutex.Lock()
		containers[con.ID] = &ContainerState{Container: *con, PtyFile: ptyFile}
		stateMutex.Unlock()

		c.JSON(200, con)
	})

	r.DELETE("/api/containers/:id", func(c *gin.Context) {
		id := c.Param("id")
		stateMutex.Lock()
		delete(containers, id)
		stateMutex.Unlock()
		
		containerDir := filepath.Join(container.BaseDir, "containers", id)
		os.RemoveAll(containerDir)
		c.JSON(200, gin.H{"status": "deleted"})
	})

	r.GET("/api/containers/:id/attach", func(c *gin.Context) {
		id := c.Param("id")
		stateMutex.Lock()
		conState, exists := containers[id]
		stateMutex.Unlock()

		if !exists {
			c.String(404, "not found")
			return
		}

		ws, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			return
		}
		defer ws.Close()

		go func() {
			buf := make([]byte, 1024)
			for {
				n, err := conState.PtyFile.Read(buf)
				if err != nil {
					break
				}
				ws.WriteMessage(websocket.TextMessage, buf[:n])
			}
		}()

		for {
			_, msg, err := ws.ReadMessage()
			if err != nil {
				break
			}
			conState.PtyFile.Write(msg)
		}
	})

	r.Run(fmt.Sprintf(":%d", port))
}
