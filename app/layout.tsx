import "./globals.css";
import Sidebar from "./components/layout/Sidebar";
import MobileNav from "./components/layout/MobileNav";
import FavoritesBubbles from "./components/FavoritesBubbles";
import { ReactNode } from "react";

export const metadata = {
  title: "WinAgain",
  description: "Football analytics",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-gradient-to-b from-[#13002e] to-[#5f2370] text-white">

        {/* Sidebar */}
        <div
          className="
    hidden md:flex mobile-hide fixed left-0 top-0 h-full w-64 
    bg-gradient-to-b from-[#13002e]/80 to-[#5f2370]/80 
    backdrop-blur-xl 
    border-r border-white/10 
    text-white
    flex-col
  "
        >
          <Sidebar />
        </div>

        {/* Contenu */}
        <main className="min-h-screen mobile-main ml-0 md:ml-64 p-4 sm:p-6 pb-24 md:pb-6">
          {children}
        </main>

        <MobileNav />
        <FavoritesBubbles />
      </body>
    </html>
  );
}
