//go:build linux

package container

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"

	"github.com/google/uuid"
)

type Container struct {
	ID      string `json:"id"`
	Image   string `json:"image"`
	Status  string `json:"status"`
	Command string `json:"command"`
}

const BaseDir = "/var/lib/minidock"

func PrepareContainer(imageRef, cmdString string) (*Container, *exec.Cmd, error) {
	id := uuid.New().String()[:12]
	
	// OverlayFS treats ":" as a split character for multiple lowerdirs. 
	// We MUST sanitize the directory name on the filesystem.
	safeImageRef := strings.ReplaceAll(imageRef, ":", "_")
	imageDir := filepath.Join(BaseDir, "images", safeImageRef)
	if _, err := os.Stat(imageDir); os.IsNotExist(err) {
		return nil, nil, fmt.Errorf("image %s not found. Please pull it first", imageRef)
	}

	containerDir := filepath.Join(BaseDir, "containers", id)
	upperDir := filepath.Join(containerDir, "upper")
	workDir := filepath.Join(containerDir, "work")
	mergedDir := filepath.Join(containerDir, "merged")

	for _, d := range []string{upperDir, workDir, mergedDir} {
		if err := os.MkdirAll(d, 0755); err != nil {
			return nil, nil, err
		}
	}

	mountData := fmt.Sprintf("lowerdir=%s,upperdir=%s,workdir=%s", imageDir, upperDir, workDir)
	err := syscall.Mount("overlay", mergedDir, "overlay", 0, mountData)
	if err != nil {
		return nil, nil, fmt.Errorf("overlay mount failed: %v", err)
	}

	cmd := exec.Command("/proc/self/exe", "child", mergedDir, cmdString)
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Cloneflags:   syscall.CLONE_NEWUTS | syscall.CLONE_NEWPID | syscall.CLONE_NEWNS | syscall.CLONE_NEWNET,
		Unshareflags: syscall.CLONE_NEWNS,
	}

	con := &Container{
		ID:      id,
		Image:   imageRef,
		Status:  "Running",
		Command: cmdString,
	}
	return con, cmd, nil
}

func ChildProcess(mergedDir, cmdString string) {
	// 1. Isolate Environment
	syscall.Sethostname([]byte("minidock-container"))
	syscall.Chroot(mergedDir)
	syscall.Chdir("/")
	
	// Mount proc so `ps` and other tools work
	syscall.Mount("proc", "proc", "proc", 0, "")

	// 2. Parse command properly
	parts := strings.Fields(cmdString)
	if len(parts) == 0 {
		parts = []string{"/bin/sh"}
	}

	cmd := exec.Command(parts[0], parts[1:]...)
	
	// CRITICAL: Set standard isolated environment variables
	cmd.Env = []string{
		"PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
		"TERM=xterm",
		"HOME=/root",
		"USER=root",
	}

	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		fmt.Fprintf(os.Stderr, "Child process exit: %v\n", err)
	}

	syscall.Unmount("proc", 0)
}
