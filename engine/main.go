package main

import (
	"fmt"
	"os"

	"github.com/minidock/engine/cmd"
	"github.com/minidock/engine/pkg/container"
)

func main() {
	// This hidden intercept acts as the entrypoint for the isolated child process.
	// It is triggered by the parent calling /proc/self/exe child <mergedDir> <cmd>
	if len(os.Args) >= 4 && os.Args[1] == "child" {
		container.ChildProcess(os.Args[2], os.Args[3])
		os.Exit(0)
	}

	if err := cmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}
