import Link from "next/link";

export default function Home() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-4 py-12">
        <div className="inline-block p-2 px-4 rounded-full bg-blue-900/30 border border-blue-500/30 text-blue-400 text-sm font-medium mb-4">
          Experimental UI Version 0.1
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight">
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">MiniDock</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          A custom-built, lightweight container runtime engine and desktop dashboard, designed from scratch to demystify Docker.
        </p>
      </section>

      {/* Project Setup & Description */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative background blur */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <span className="text-blue-400 mr-3 text-3xl">🚀</span> Architecture Overview
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8 text-slate-300 relative z-10">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white flex items-center">
               <span className="bg-blue-600 w-2 h-6 rounded mr-2"></span> The Go Daemon
            </h3>
            <p className="text-slate-400">
              The backend engine is written in Go and uses Linux kernel features directly.
              It utilizes <strong>Namespaces</strong> for isolation (PID, UTS, Mount) and <strong>Cgroups</strong> for resource limitation, and overlaid filesystems for layering.
            </p>
            <div className="bg-[#0f1015] p-4 rounded-lg font-mono text-emerald-400 border border-slate-800 flex flex-col gap-1 text-sm shadow-inner">
              <span>$ cd engine</span>
              <span>$ go run main.go daemon</span>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white flex items-center">
              <span className="bg-emerald-500 w-2 h-6 rounded mr-2"></span> The Next.js UI
            </h3>
            <p className="text-slate-400">
              This beautiful dashboard communicates with the Go daemon via REST APIs.
              It runs natively on Windows/Linux and features interactive terminals powered by <strong>xterm.js</strong> via WebSockets.
            </p>
            <div className="bg-[#0f1015] p-4 rounded-lg text-emerald-400 border border-slate-800 font-mono flex flex-col gap-1 text-sm shadow-inner">
              <span>$ cd ui</span>
              <span>$ npm run dev</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="grid grid-cols-2 gap-6">
        <Link href="/containers" className="group p-8 bg-slate-900 border border-slate-800 rounded-2xl hover:border-blue-500 transition-all shadow-xl hover:shadow-blue-900/20">
          <div className="h-12 w-12 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-xl mb-4 group-hover:bg-blue-500 group-hover:text-white transition-colors">
            🧊
          </div>
          <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">Manage Containers &rarr;</h3>
          <p className="text-slate-400">Start, stop, and attach terminals to your running isolated processes across namespaces.</p>
        </Link>
        <Link href="/images" className="group p-8 bg-slate-900 border border-slate-800 rounded-2xl hover:border-emerald-500 transition-all shadow-xl hover:shadow-emerald-900/20">
          <div className="h-12 w-12 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl mb-4 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
            💿
          </div>
          <h3 className="text-xl font-bold mb-2 group-hover:text-emerald-400 transition-colors">Manage Images &rarr;</h3>
          <p className="text-slate-400">Pull lightweight Alpine or Ubuntu layers from the Docker Hub registry and mount overlays.</p>
        </Link>
      </section>
    </div>
  );
}
