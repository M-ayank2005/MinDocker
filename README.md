# 🧊 MinDocker (Docker from scratch in Go)

A custom-built, lightweight container runtime engine and graphical desktop dashboard, designed from the ground up to demystify how Docker works under the hood.

![Next.js UI](https://img.shields.io/badge/Frontend-Next.js-black?style=for-the-badge&logo=next.js)
![Go Engine](https://img.shields.io/badge/Backend-Go-00ADD8?style=for-the-badge&logo=go)
![Linux Kernel](https://img.shields.io/badge/Kernel-Linux-FCC624?style=for-the-badge&logo=linux)

## 🚀 Architecture Overview

This project consists of two main decoupled components:

1. **The Go Daemon (`/engine`)**: The backend container engine written in Go. It directly interfaces with Linux kernel primitives to isolate processes.
   - **Namespaces**: Isolates Process IDs (PID), Hostnames (UTS), Mount points (NS), and Network stacks.
   - **OverlayFS**: Uses union filesystems to stack lightweight, read-only Docker Hub images with a read-write upper container layer securely in `/var/lib/minidock`.
   - **Registry Interactions**: Fetches and extracts OCI-compliant layer tarballs directly from Docker Hub via the `go-containerregistry` library.
   - **PTY Integration**: Bridges terminal IO (stdin/stdout/stderr) over WebSockets so you can interact with the isolated shells remotely without a dedicated console.

2. **The Next.js UI (`/ui`)**: A modern desktop-like dashboard designed with Tailwind CSS.
   - Beautiful modals to search and **auto-pull** images dynamically from Docker Hub.
   - Real-time active container status visualization.
   - Live browser-based terminal using **xterm.js** that connects seamlessly to the Go daemon over WebSockets.

---

## 🛠️ How to Use

Because true container isolation requires Linux-specific kernel features (Namespaces, Cgroups, OverlayFS), the **Go Daemon must be executed on Linux** (or WSL2 if you are on Windows). The **Next.js UI can be run anywhere** (Windows, Mac, or Linux).

### 1. Start the Next.js UI (Windows / Mac / Linux)

Open a terminal, navigate to the `ui` folder, and start the development server:

```bash
cd ui
npm install
npm run dev
```

The graphical dashboard will be available at [http://localhost:3000](http://localhost:3000).

### 2. Start the Go Daemon (Linux / WSL2 ONLY)

Open a Linux or WSL2 terminal, and ensure you have the `go` compiler installed (`sudo apt install golang-go` on Debian/Ubuntu).

```bash
cd engine
go mod tidy

# Root (sudo) is REQUIRED because Namespaces and OverlayFS mounts require privileges.
sudo go run main.go daemon
```

The daemon API and WebSocket proxy will bind to `:8080` by default.

### 3. Run Your First Container!

1. Open the UI dashboard in your browser.
2. Go to the **Containers** tab and click **Run New Container**.
3. Type `alpine:latest` and use the default command `/bin/sh`.
4. Click deploy. The Go backend will temporarily pause to **auto-pull** the Alpine linux root filesystem from Docker Hub, configure the OverlayFS, spawn the namespaces, and start the shell!
5. Click **Attach TTY** to interact directly with the shell inside your custom isolated container!

Happy Containerizing!
