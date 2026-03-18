"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const links = [
    { label: "Home", href: "/" },
    { label: "Containers", href: "/containers" },
    { label: "Images", href: "/images" },
  ];

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 text-white flex flex-col h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          MiniDock
        </h1>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-4 py-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-600 text-white font-medium shadow-lg shadow-blue-500/30"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-6 border-t border-gray-800">
        <p className="text-xs text-gray-500">MiniDock Engine v0.1.0</p>
      </div>
    </aside>
  );
}
