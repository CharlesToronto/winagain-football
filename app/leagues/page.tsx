"use client";

import { useMemo, useState } from "react";
import Card from "@/app/components/ui/Card";
import Link from "next/link";
import { Search } from "lucide-react";
import { COMPETITION_IDS_BY_COUNTRY, ALL_COMPETITION_IDS } from "@/app/lib/data/competitionIds";

// TOP 5 major leagues
const TOP_LEAGUES = [
  { id: 39, name: "Premier League", country: "England", logo: "https://media.api-sports.io/football/leagues/39.png" },
  { id: 140, name: "LaLiga", country: "Spain", logo: "https://media.api-sports.io/football/leagues/140.png" },
  { id: 135, name: "Serie A", country: "Italy", logo: "https://media.api-sports.io/football/leagues/135.png" },
  { id: 78, name: "Bundesliga", country: "Germany", logo: "https://media.api-sports.io/football/leagues/78.png" },
  { id: 61, name: "Ligue 1", country: "France", logo: "https://media.api-sports.io/football/leagues/61.png" },
];

const leaguesData = COMPETITION_IDS_BY_COUNTRY.flatMap((group) =>
  group.ids.map((id) => ({
    id,
    name: `League ${id}`,
    country: group.country
  }))
);

export default function LeaguesPage() {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  // Filter all leagues by search
  const filteredLeagues = useMemo(() => {
    if (!query) return leaguesData;
    const q = query.toLowerCase();
    return leaguesData.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.country.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="p-6 flex flex-col gap-10">

      {/* SEARCH BAR */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher une ligue…"
          className="w-full rounded-lg border px-10 py-2 focus:ring-2 focus:ring-blue-500 text-sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* TOP 5 LEAGUES */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Top 5 Ligues Européennes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6">
          {TOP_LEAGUES.map((l) => (
            <Card key={l.id} className="flex flex-col items-center gap-4 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.logo} className="h-16 w-16" alt={l.name} />
              <div>
                <p className="text-lg font-semibold">{l.name}</p>
                <p className="text-gray-500 text-sm">{l.country}</p>
              </div>
              <Link
                href={`/league/${l.id}`}
                className="text-blue-600 text-sm font-medium hover:underline"
              >
                Voir la ligue →
              </Link>
            </Card>
          ))}
        </div>
      </div>

      {/* ALL LEAGUES DROPDOWN */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-blue-600 text-sm font-medium hover:underline"
        >
          {expanded ? "Masquer toutes les ligues ↑" : "Afficher toutes les ligues ↓"}
        </button>

        {expanded && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredLeagues.map((l) => (
              <Card key={l.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://media.api-sports.io/football/leagues/${l.id}.png`}
                    className="h-6 w-6"
                    alt={l.name}
                  />
                  <div>
                    <p className="text-sm font-semibold">{l.name}</p>
                    <p className="text-xs text-gray-500">{l.country}</p>
                  </div>
                </div>

                <Link
                  href={`/league/${l.id}`}
                  className="text-blue-600 text-xs font-medium hover:underline"
                >
                  Voir →
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
