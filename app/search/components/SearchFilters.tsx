"use client";

import type {
  FactType,
  OverUnderDirection,
  ResultType,
  SearchFilters,
} from "../types";

const FACT_OPTIONS: { label: string; value: FactType }[] = [
  { label: "Aucun filtre", value: "none" },
  { label: "Over/Under (buts totaux)", value: "OVER_UNDER" },
  { label: "Resultat (1/X/2)", value: "RESULT" },
  { label: "Clean sheet", value: "CLEAN_SHEET" },
];

const RESULT_OPTIONS: { label: string; value: ResultType }[] = [
  { label: "1 (Victoire equipe)", value: "1" },
  { label: "X (Nul)", value: "X" },
  { label: "2 (Defaite equipe)", value: "2" },
  { label: "1X (Victoire ou nul)", value: "1X" },
  { label: "X2 (Nul ou defaite)", value: "X2" },
  { label: "12 (Pas de nul)", value: "12" },
];

const OVER_UNDER_LINES = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5];

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
  const selectClassName =
    "rounded bg-[#1f0f3a] border border-white/20 px-2 py-2 text-sm text-white [color-scheme:dark]";
  const factType = filters.factType ?? "none";
  const streakMin = filters.streakMin ?? 1;
  const overUnderDirection = filters.overUnderDirection ?? "OVER";
  const overUnderLine = filters.overUnderLine ?? 2.5;
  const resultType = filters.resultType ?? "1X";
  const nextMatchBelowEnabled = filters.nextMatchBelowEnabled ?? false;
  const nextMatchBelowLine = filters.nextMatchBelowLine ?? 1.5;
  const nextMatchBelowMinPercent = filters.nextMatchBelowMinPercent;
  const inputClassName =
    "rounded bg-[#1f0f3a] border border-white/20 px-2 py-2 text-sm text-white [color-scheme:dark]";

  const updateFactType = (value: FactType) => {
    const next: SearchFilters = { ...filters, factType: value };
    if (value === "OVER_UNDER") {
      next.overUnderDirection = overUnderDirection;
      next.overUnderLine = overUnderLine;
    }
    if (value === "RESULT") {
      next.resultType = resultType;
    }
    if (next.streakMin == null) {
      next.streakMin = 1;
    }
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-white">
        <h2 className="text-xl font-semibold mb-4">Filtres de recherche</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-white/70">Condition dernier match</label>
            <select
              className={selectClassName}
              value={factType}
              onChange={(e) => updateFactType(e.target.value as FactType)}
            >
              {FACT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-white/70">Details condition</label>
            {factType === "OVER_UNDER" ? (
              <div className="flex items-center gap-2">
                <select
                  className={selectClassName}
                  value={overUnderDirection}
                  onChange={(e) =>
                    onChange({
                      ...filters,
                      overUnderDirection: e.target.value as OverUnderDirection,
                    })
                  }
                >
                  <option value="OVER">Over</option>
                  <option value="UNDER">Under</option>
                </select>
                <select
                  className={selectClassName}
                  value={overUnderLine}
                  onChange={(e) =>
                    onChange({
                      ...filters,
                      overUnderLine: Number(e.target.value),
                    })
                  }
                >
                  {OVER_UNDER_LINES.map((line) => (
                    <option key={line} value={line}>
                      {line}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {factType === "RESULT" ? (
              <select
                className={selectClassName}
                value={resultType}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    resultType: e.target.value as ResultType,
                  })
                }
              >
                {RESULT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : null}

            {factType === "CLEAN_SHEET" ? (
              <div className="text-xs text-white/60">
                Match sans but encaisse.
              </div>
            ) : null}

            {factType === "none" ? (
              <div className="text-xs text-white/60">Aucune condition active.</div>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-white/70">Serie en cours (min)</label>
            <select
              className={selectClassName}
              value={streakMin}
              onChange={(e) =>
                onChange({
                  ...filters,
                  streakMin: Number(e.target.value),
                })
              }
              disabled={factType === "none"}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} match{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
            <span className="text-xs text-white/50">
              La serie part du dernier match.
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-white">
        <h3 className="text-lg font-semibold mb-4">Match suivant sous</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-white/70">Match suivant sous</label>
            <button
              type="button"
              onClick={() =>
                onChange({ ...filters, nextMatchBelowEnabled: !nextMatchBelowEnabled })
              }
              className={`rounded px-3 py-2 text-sm font-semibold transition ${
                nextMatchBelowEnabled
                  ? "bg-green-600 text-white"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              {nextMatchBelowEnabled ? "Actif" : "Inactif"}
            </button>
            <span className="text-xs text-white/60">
              BasAc sur les buts marquAcs par l'Acquipe.
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-white/70">Seuil buts marquAcs</label>
            <select
              className={selectClassName}
              value={nextMatchBelowLine}
              onChange={(e) =>
                onChange({
                  ...filters,
                  nextMatchBelowLine: Number(e.target.value),
                })
              }
              disabled={!nextMatchBelowEnabled}
            >
              {OVER_UNDER_LINES.map((line) => (
                <option key={line} value={line}>
                  +{line}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-white/70">% minimum</label>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="Ex: 60"
              className={inputClassName}
              value={nextMatchBelowMinPercent ?? ""}
              onChange={(e) =>
                onChange({
                  ...filters,
                  nextMatchBelowMinPercent:
                    e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
              disabled={!nextMatchBelowEnabled}
            />
            <span className="text-xs text-white/50">
              Laisse vide pour tout afficher.
            </span>
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
    </div>
  );
}
