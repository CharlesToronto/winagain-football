import "./globals.css";
import Sidebar from "./components/layout/Sidebar";
import FavoritesBubbles from "./components/FavoritesBubbles";
import { ReactNode } from "react";

export const metadata = {
  title: "WinAgain",
  description: "Football analytics",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen flex bg-gradient-to-b from-[#13002e] to-[#5f2370] text-white">

        {/* Sidebar */}
        <div
          className="
    fixed left-0 top-0 h-full w-64 
    bg-gradient-to-b from-[#13002e]/80 to-[#5f2370]/80 
    backdrop-blur-xl 
    border-r border-white/10 
    text-white
    flex flex-col
  "
        >
          <Sidebar />
        </div>

        {/* Contenu */}
        <main className="flex-1 ml-64 p-6">
          {children}
        </main>

        <FavoritesBubbles />
      </body>
    </html>
  );
}
