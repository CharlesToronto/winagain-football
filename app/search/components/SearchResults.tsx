"use client";

import { TeamResult } from "../types";
import { TeamResultCard } from "./TeamResultCard";

export function SearchResults({
  results,
  loading,
  error,
}: {
  results: TeamResult[];
  loading: boolean;
  error?: string | null;
}) {
  if (error) {
    return (
      <div className="mt-4 text-red-300 text-sm bg-red-900/30 border border-red-500/20 rounded-lg p-4">
        {error}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mt-4 text-white/70 text-sm bg-white/5 border border-white/10 rounded-lg p-4">
        Recherche en cours...
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="mt-4 text-white/70 text-sm bg-white/5 border border-white/10 rounded-lg p-4">
        Aucun résultat pour ces filtres. Ajuste les plages de probabilité ou le marché.
      </div>
    );
  }

  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      {results.map((team) => (
        <TeamResultCard key={team.id} team={team} />
      ))}
    </div>
  );
}
