package cmd

import (
	"fmt"
	"github.com/spf13/cobra"
)

var runCmd = &cobra.Command{
	Use:   "run [image] [command]",
	Short: "Run a command in a new container",
	Args:  cobra.MinimumNArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Printf("Running image %s\n", args[0])
		// TODO: Implement isolation routines (Namespaces, cgroups, chroot)
	},
}

func init() {
	rootCmd.AddCommand(runCmd)
}
