"use client";
import { useState, useEffect } from "react";
import TerminalPane from "@/components/TerminalPane";

export default function ContainersPage() {
  const [activeTerminal, setActiveTerminal] = useState<string | null>(null);
  const [containers, setContainers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newImg, setNewImg] = useState("alpine:latest");
  const [newCmd, setNewCmd] = useState("/bin/sh");
  const [availableImages, setAvailableImages] = useState<any[]>([]);
  const [deploying, setDeploying] = useState(false);

  const fetchContainers = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/containers");
      if (res.ok) setContainers(await res.json());
    } catch (e) {}
  };

  const fetchImages = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/images");
      if (res.ok) setAvailableImages(await res.json());
    } catch (e) {}
  };

  useEffect(() => {
    fetchContainers();
    fetchImages();
    const intv = setInterval(fetchContainers, 3000);
    return () => clearInterval(intv);
  }, []);

  const runContainer = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeploying(true);
    try {
      const res = await fetch("http://localhost:8080/api/containers/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: newImg, command: newCmd })
      });
      if (!res.ok) {
         const d = await res.json();
         alert("Engine Error: " + d.error);
      } else {
         setShowModal(false);
         fetchContainers();
      }
    } catch(e) {
      alert("Failed to run container.");
    } finally {
      setDeploying(false);
    }
  };

  const deleteContainer = async (id: string) => {
    await fetch(`http://localhost:8080/api/containers/${id}`, { method: "DELETE" });
    if (activeTerminal === id) setActiveTerminal(null);
    fetchContainers();
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 relative">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Containers</h1>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20">
          Run New Container
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">Run Container</h2>
            <form onSubmit={runContainer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Image (Auto-pulls if missing!)</label>
                <input 
                  type="text" 
                  value={newImg} 
                  onChange={e => setNewImg(e.target.value)} 
                  list="downloaded-images"
                  placeholder="e.g. alpine:latest"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" 
                />
                <datalist id="downloaded-images">
                  {availableImages.map(img => (
                    <option key={img.id} value={img.id} />
                  ))}
                </datalist>
                <p className="text-xs text-slate-500 mt-2 italic">If the image isn't downloaded yet, it will automatically pause and pull it from Docker Hub before running.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Command</label>
                <input type="text" value={newCmd} onChange={e => setNewCmd(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg font-medium transition-colors" disabled={deploying}>Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20 flex justify-center items-center" disabled={deploying}>
                  {deploying ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : "Deploy & Run"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/50 border-b border-slate-800 text-slate-400">
              <th className="p-4 font-medium uppercase text-xs tracking-wider">Container ID</th>
              <th className="p-4 font-medium uppercase text-xs tracking-wider">Image</th>
              <th className="p-4 font-medium uppercase text-xs tracking-wider">Command</th>
              <th className="p-4 font-medium uppercase text-xs tracking-wider">Status</th>
              <th className="p-4 font-medium uppercase text-xs tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-sm">
            {containers.map((c) => (
              <tr key={c.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="p-4 font-mono text-blue-400">{c.id.substring(0, 12)}</td>
                <td className="p-4">{c.image}</td>
                <td className="p-4 font-mono text-slate-400">{c.command}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    c.status === 'Running' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'
                  }`}>
                    {c.status}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  {c.status === "Running" && (
                    <button 
                      onClick={() => setActiveTerminal(activeTerminal === c.id ? null : c.id)}
                      className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded transition-colors"
                    >
                      {activeTerminal === c.id ? "Hide TTY" : "Attach TTY"}
                    </button>
                  )}
                  <button onClick={() => deleteContainer(c.id)} className="text-xs bg-red-900/30 hover:bg-red-900/60 text-red-500 px-3 py-1.5 rounded transition-colors">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {containers.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  No containers running. Click "Run New Container" to start.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {activeTerminal && (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <h2 className="text-xl font-bold mb-4 flex items-center">
             <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
             Terminal Session (Container {activeTerminal})
           </h2>
           <TerminalPane containerId={activeTerminal} />
        </div>
      )}
    </div>
  );
}
