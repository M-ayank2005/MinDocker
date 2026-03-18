package cmd

import (
	"fmt"

	"github.com/minidock/engine/pkg/api"
	"github.com/spf13/cobra"
)

var daemonCmd = &cobra.Command{
	Use:   "daemon",
	Short: "Start the container engine daemon API server",
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("Starting MiniDock API Daemon on :8080...")
		api.StartServer(8080)
	},
}

func init() {
	rootCmd.AddCommand(daemonCmd)
}
