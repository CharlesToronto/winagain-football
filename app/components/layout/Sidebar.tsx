"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, Trophy, Search, Users2, Settings, Wallet } from "lucide-react";

const navItems = [
  { name: "Home", href: "/home", icon: Home },
  { name: "Leagues", href: "/leagues", icon: Trophy },
  { name: "Bankroll", href: "/bankroll", icon: Wallet },
  { name: "Search", href: "/search", icon: Search },
  { name: "Users", href: "/users", icon: Users2 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div
      className="
    h-full w-64
    bg-gradient-to-b from-[#13002e]/80 to-[#5f2370]/80
    backdrop-blur-xl
    border-r border-white/10
    text-white
    flex flex-col
    p-6
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
    </div>
  );
}
