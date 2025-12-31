"use client";

import { useMemo, useState } from "react";
import GoalsScoredTrendCard, {
  buildEntries,
  type Location,
  type Mode,
  type SeriesEntry,
} from "./GoalsScoredTrendCard";

type Fixture = any;

function formatNumber(value: number) {
  if (Number.isNaN(value)) return "--";
  const rounded = Math.round(value * 100) / 100;
  return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(2);
}

function resolveTeamName(fixtures: Fixture[]) {
  const match = (fixtures ?? []).find(
    (fixture) =>
      typeof fixture?.isHome === "boolean" &&
      (fixture?.home_team_name || fixture?.away_team_name)
  );
  if (!match) return null;
  return match.isHome ? match.home_team_name ?? null : match.away_team_name ?? null;
}

function computeNextMatchBelow(
  entries: SeriesEntry[],
  threshold: number
) {
  if (!entries.length) {
    return {
      lastValue: null,
      lastAbove: false,
      triggers: 0,
      belowNext: 0,
      percent: 0,
    };
  }

  let triggers = 0;
  let belowNext = 0;
  for (let i = 0; i < entries.length - 1; i++) {
    if (entries[i].value > threshold) {
      triggers += 1;
      if (entries[i + 1].value < threshold) {
        belowNext += 1;
      }
    }
  }
  const percent = triggers ? Math.round((belowNext / triggers) * 100) : 0;
  const lastValue = entries[entries.length - 1]?.value ?? null;
  const lastAbove = lastValue !== null && lastValue > threshold;

  return {
    lastValue,
    lastAbove,
    triggers,
    belowNext,
    percent,
  };
}

function NextMatchBelowCard({
  entries,
  threshold,
  teamName,
}: {
  entries: SeriesEntry[];
  threshold: number;
  teamName?: string | null;
}) {
  const summary = useMemo(
    () => computeNextMatchBelow(entries, threshold),
    [entries, threshold]
  );
  const thresholdLabel = `+${formatNumber(threshold)}`;
  const resolvedTeam = teamName || "cette equipe";
  const showPercent = summary.lastAbove && summary.triggers > 0;
  const percentLabel = showPercent ? `${summary.percent}%` : "--";
  const detailLabel = summary.triggers
    ? `${summary.percent}% (${summary.belowNext}/${summary.triggers}) des matchs suivants, dans une situation similaire, se sont terminés avec un nombre de buts inscrits par ${resolvedTeam} inférieur a ${thresholdLabel}`
    : `Aucun match au-dessus de ${thresholdLabel}`;

  return (
    <div className="bg-white/5 rounded-xl p-6 shadow flex flex-col gap-4">
      <div>
        <h3 className="font-semibold">Match suivant sous {thresholdLabel}</h3>
        <p className="text-xs text-white/70">
          {summary.lastValue === null ? (
            "Aucune donnee recente"
          ) : (
            <span className="inline-flex items-center gap-2">
              <span
                className={`inline-flex items-center justify-center w-4 h-4 rounded-full border border-white/10 ${
                  summary.lastAbove ? "text-green-400" : "text-red-400"
                }`}
                aria-hidden
              >
                {summary.lastAbove ? (
                  <svg viewBox="0 0 20 20" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 10l3 3 8-8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 20 20" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 5l10 10M15 5l-10 10" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span>Dernier match {thresholdLabel}</span>
            </span>
          )}
        </p>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className={`text-6xl font-bold ${showPercent ? "text-green-400" : "text-white/40"}`}>
          {percentLabel}
        </div>
      </div>
      <div className="text-xs text-white/70 space-y-1">
        <div>{detailLabel}</div>
        <div>
          → Dernier but marqué :{" "}
          {summary.lastValue === null ? "--" : formatNumber(summary.lastValue)}
        </div>
      </div>
    </div>
  );
}

export default function GoalsScoredTrendSection({
  fixtures,
  opponentFixtures = [],
  opponentName = "Adversaire",
  referenceCount = 0,
  mode = "FT",
}: {
  fixtures: Fixture[];
  opponentFixtures?: Fixture[];
  opponentName?: string;
  referenceCount?: number;
  mode?: Mode;
}) {
  const [location, setLocation] = useState<Location>("all");
  const [threshold, setThreshold] = useState(1.5);

  const entries = useMemo(
    () => buildEntries(fixtures ?? [], mode, location),
    [fixtures, mode, location]
  );
  const teamName = useMemo(() => resolveTeamName(fixtures ?? []), [fixtures]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <GoalsScoredTrendCard
        fixtures={fixtures ?? []}
        opponentFixtures={opponentFixtures}
        opponentName={opponentName}
        referenceCount={referenceCount}
        mode={mode}
        teamName={teamName}
        threshold={threshold}
        onThresholdChange={setThreshold}
        location={location}
        onLocationChange={setLocation}
      />
      <NextMatchBelowCard entries={entries} threshold={threshold} teamName={teamName} />
    </div>
  );
}
