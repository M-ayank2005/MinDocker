"use client";
import { useState, useEffect } from "react";

export default function ImagesPage() {
  const [pullImage, setPullImage] = useState("");
  const [pulling, setPulling] = useState(false);
  const [images, setImages] = useState<any[]>([]);

  const fetchImages = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/images");
      if (res.ok) setImages(await res.json());
    } catch (e) {}
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handlePull = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pullImage) return;
    setPulling(true);
    
    try {
      const res = await fetch("http://localhost:8080/api/images/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: pullImage })
      });
      if (!res.ok) {
        const err = await res.json();
        alert("Error: " + err.error);
      }
      fetchImages();
    } catch(e) {
      alert("Failed to pull image. Is the daemon running on :8080?");
    } finally {
      setPulling(false);
      setPullImage("");
    }
  };

  const deleteImage = async (id: string) => {
    await fetch(`http://localhost:8080/api/images/${id}`, { method: "DELETE" });
    fetchImages();
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Images</h1>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <h2 className="text-xl font-bold mb-4">Pull New Image</h2>
        <form onSubmit={handlePull} className="flex gap-4">
          <input 
            type="text" 
            value={pullImage}
            onChange={(e) => setPullImage(e.target.value)}
            placeholder="e.g. alpine:latest" 
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button 
            type="submit" 
            disabled={pulling}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-500/20 w-40 flex justify-center items-center"
          >
            {pulling ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : "Pull Image"}
          </button>
        </form>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/50 border-b border-slate-800 text-slate-400">
              <th className="p-4 font-medium uppercase text-xs tracking-wider">Repository</th>
              <th className="p-4 font-medium uppercase text-xs tracking-wider">Tag</th>
              <th className="p-4 font-medium uppercase text-xs tracking-wider">Size</th>
              <th className="p-4 font-medium uppercase text-xs tracking-wider">Created</th>
              <th className="p-4 font-medium uppercase text-xs tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-sm">
            {images.map((img, i) => (
              <tr key={img.id || i} className="hover:bg-slate-800/50 transition-colors">
                <td className="p-4 font-medium">{img.repo}</td>
                <td className="p-4 text-emerald-400">{img.tag}</td>
                <td className="p-4 text-slate-400">{img.size}</td>
                <td className="p-4 text-slate-400">{img.created}</td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={() => deleteImage(img.id)} className="text-xs bg-red-900/30 hover:bg-red-900/60 text-red-500 px-3 py-1.5 rounded transition-colors">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {images.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  No images downloaded. Go ahead and pull one!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
