package cmd

import (
	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:   "minidock",
	Short: "MiniDock is a tiny container engine tailored for learning",
	Long:  `A minimal container runtime and daemon implementation in Go.`,
}

func Execute() error {
	return rootCmd.Execute()
}
