"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "./navItems";
import CiblePanel from "@/app/components/cible/CiblePanel";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div
      className="
    h-full w-64
    bg-transparent
    backdrop-blur-xl
    border-r border-white/10
    text-white
    flex flex-col
    p-6
    overflow-y-auto
  "
    >
      <nav className="flex flex-col gap-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm ${
                active ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"
              }`}
            >
              <Icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="mt-6">
        <CiblePanel />
      </div>
      <div className="mt-auto pt-6">
        <div id="sidebar-tools" />
      </div>
    </div>
  );
}
