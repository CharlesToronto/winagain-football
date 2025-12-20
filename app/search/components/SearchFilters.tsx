"use client";

import { useMemo } from "react";
import { MarketType, NextMatchWindow, SearchFilters } from "../types";

const MARKET_GROUPS: { title: string; options: { label: string; value: MarketType }[] }[] = [
  {
    title: "Over",
    options: [
      { label: "Over 0.5", value: "OVER_0_5" },
      { label: "Over 1.5", value: "OVER_1_5" },
      { label: "Over 2.5", value: "OVER_2_5" },
      { label: "Over 3.5", value: "OVER_3_5" },
      { label: "Over 4.5", value: "OVER_4_5" },
    ],
  },
  {
    title: "Under",
    options: [
      { label: "Under 0.5", value: "UNDER_0_5" },
      { label: "Under 1.5", value: "UNDER_1_5" },
      { label: "Under 2.5", value: "UNDER_2_5" },
      { label: "Under 3.5", value: "UNDER_3_5" },
      { label: "Under 4.5", value: "UNDER_4_5" },
      { label: "Under 5.5", value: "UNDER_5_5" },
    ],
  },
  {
    title: "Double chance",
    options: [
      { label: "1X", value: "DC_1X" },
      { label: "X2", value: "DC_X2" },
      { label: "12", value: "DC_12" },
    ],
  },
];

const NEXT_MATCH_OPTIONS: { label: string; value: NextMatchWindow }[] = [
  { label: "Today", value: "today" },
  { label: "J+1", value: "j1" },
  { label: "J+2", value: "j2" },
  { label: "J+3", value: "j3" },
];

export function SearchFilters({
  filters,
  onChange,
  onSearch,
  loading,
}: {
  filters: SearchFilters;
  onChange: (next: SearchFilters) => void;
  onSearch: () => void;
  loading: boolean;
}) {
  const selectedMarkets = useMemo(() => new Set(filters.markets), [filters.markets]);

  const toggleMarket = (value: MarketType) => {
    const next = new Set(selectedMarkets);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange({ ...filters, markets: Array.from(next) });
  };


  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-white">
      <h2 className="text-xl font-semibold mb-4">Filtres de recherche</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm text-white/70">Prochain match</label>
          <div className="flex gap-2 flex-wrap">
            {NEXT_MATCH_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onChange({ ...filters, nextMatch: opt.value })}
                className={`px-3 py-1 text-sm rounded-md ${
                  filters.nextMatch === opt.value ? "bg-green-600" : "bg-white/10"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-white/70">Probabilité verte (%)</label>
            <div className="flex items-center gap-2 text-sm">
              <input
                type="number"
                className="w-16 rounded bg-white/10 px-2 py-1"
                value={filters.probGreenMin}
                onChange={(e) =>
                  onChange({ ...filters, probGreenMin: Number(e.target.value) || 0 })
                }
                min={0}
                max={100}
              />
              <span>→</span>
              <input
                type="number"
                className="w-16 rounded bg-white/10 px-2 py-1"
                value={filters.probGreenMax}
                onChange={(e) =>
                  onChange({ ...filters, probGreenMax: Number(e.target.value) || 100 })
                }
                min={0}
                max={100}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-white/70">Probabilité bleue (%)</label>
            <div className="flex items-center gap-2 text-sm">
              <label className="flex items-center gap-2 text-white/70 text-xs">
                <input
                  type="checkbox"
                  checked={filters.useBlue !== false}
                  onChange={(e) => onChange({ ...filters, useBlue: e.target.checked })}
                />
                Activer
              </label>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <input
                type="number"
                className="w-16 rounded bg-white/10 px-2 py-1"
                value={filters.probBlueMin}
                onChange={(e) =>
                  onChange({ ...filters, probBlueMin: Number(e.target.value) || 0 })
                }
                min={0}
                max={100}
                disabled={filters.useBlue === false}
                title={filters.useBlue === false ? "Probabilité bleue désactivée" : ""}
              />
              <span>→</span>
              <input
                type="number"
                className="w-16 rounded bg-white/10 px-2 py-1"
                value={filters.probBlueMax}
                onChange={(e) =>
                  onChange({ ...filters, probBlueMax: Number(e.target.value) || 100 })
                }
                min={0}
                max={100}
                disabled={filters.useBlue === false}
                title={filters.useBlue === false ? "Probabilité bleue désactivée" : ""}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-sm text-white/70">Marchés (multi-select)</label>
          <div className="grid grid-cols-3 gap-3">
            {MARKET_GROUPS.map((group) => (
              <div key={group.title} className="flex flex-col gap-2">
                <p className="text-xs text-white/60">{group.title}</p>
                <div className="flex flex-wrap gap-2">
                  {group.options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => toggleMarket(opt.value)}
                      className={`px-3 py-1 text-xs rounded-md ${
                        selectedMarkets.has(opt.value) ? "bg-green-600" : "bg-white/10"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={onSearch}
          disabled={loading}
          className={`px-4 py-2 rounded-md text-sm font-semibold ${
            loading ? "bg-white/20 text-white/60" : "bg-green-600 hover:bg-green-500"
          }`}
        >
          {loading ? "Recherche..." : "Rechercher"}
        </button>
      </div>
    </div>
  );
}
