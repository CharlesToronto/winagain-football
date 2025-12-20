"use client";

import { useSearchTeams } from "./hooks/useSearchTeams";
import { SearchFilters } from "./types";
import { SearchFilters as Filters } from "./components/SearchFilters";
import { SearchResults } from "./components/SearchResults";

export default function SearchPage() {
  const { filters, setFilters, runSearch, results, loading, error } = useSearchTeams();

  return (
    <div className="min-h-screen w-full p-6 text-white space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-white/70">Recherche</p>
          <h1 className="text-3xl font-bold">Search</h1>
        </div>
      </div>

      <Filters
        filters={filters}
        onChange={(next: SearchFilters) => setFilters(next)}
        onSearch={runSearch}
        loading={loading}
      />

      <SearchResults results={results} loading={loading} error={error} />
    </div>
  );
}
