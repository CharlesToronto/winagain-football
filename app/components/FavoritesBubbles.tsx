"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FAVORITES_STORAGE_KEY, type FavoriteTeam } from "@/lib/favorites";

export default function FavoritesBubbles() {
  const [favorites, setFavorites] = useState<FavoriteTeam[]>([]);

  useEffect(() => {
    const loadFavorites = () => {
      try {
        const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
        if (!raw) {
          setFavorites([]);
          return;
        }
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const cleaned = parsed
            .filter((item) => item && typeof item.id === "number")
            .map((item) => ({
              id: item.id,
              name: item.name ?? "",
              logo: item.logo ?? null,
            }));
          setFavorites(cleaned);
        } else {
          setFavorites([]);
        }
      } catch (error) {
        setFavorites([]);
      }
    };

    loadFavorites();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === FAVORITES_STORAGE_KEY) {
        loadFavorites();
      }
    };

    const handleFavoritesUpdated = () => {
      loadFavorites();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("favorites-updated", handleFavoritesUpdated);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("favorites-updated", handleFavoritesUpdated);
    };
  }, []);

  if (favorites.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 flex items-center gap-2 md:bottom-6 md:right-6">
      {favorites.map((fav) => (
        <Link
          key={fav.id}
          href={`/team/${fav.id}?tab=stats`}
          className="w-10 h-10 rounded-full bg-white/10 border border-white/10 backdrop-blur-md shadow flex items-center justify-center overflow-hidden"
          title={fav.name || "Equipe"}
          aria-label={fav.name || "Equipe"}
        >
          {fav.logo ? (
            <img
              src={fav.logo}
              alt={fav.name || "Equipe"}
              className="w-6 h-6 object-contain"
            />
          ) : (
            <span className="text-xs font-semibold text-white">
              {(fav.name || "??").slice(0, 2).toUpperCase()}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
