import { useState, useMemo } from "react";
import { SearchFilters, TeamResult } from "../types";

const DEFAULT_FILTERS: SearchFilters = {
  nextMatch: "today",
  markets: [],
  probGreenMin: 60,
  probGreenMax: 100,
  probBlueMin: 50,
  probBlueMax: 100,
  useBlue: true,
};

export function useSearchTeams(initial: SearchFilters = DEFAULT_FILTERS) {
  const [filters, setFilters] = useState<SearchFilters>(initial);
  const [results, setResults] = useState<TeamResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/search/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });
      const json = await res.json();
      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || "Recherche échouée");
      }
      setResults(json.results ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Erreur inconnue");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const state = useMemo(
    () => ({
      filters,
      setFilters,
      results,
      loading,
      error,
      runSearch,
    }),
    [filters, results, loading, error]
  );

  return state;
}
