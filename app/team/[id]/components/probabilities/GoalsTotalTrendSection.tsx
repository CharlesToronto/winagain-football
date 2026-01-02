"use client";

import { useMemo, useState } from "react";
import GoalsTrendCard, { getGoalsForMode, type Mode } from "./GoalsTrendCard";
import AiPromptButton from "./AiPromptButton";

type Fixture = any;

type SeriesEntry = {
  date: number;
  value: number;
};

function formatNumber(value: number) {
  if (Number.isNaN(value)) return "--";
  const rounded = Math.round(value * 100) / 100;
  return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(2);
}

function buildEntries(fixtures: Fixture[] = [], mode: Mode): SeriesEntry[] {
  const mapped = fixtures
    .map((f) => {
      const dateRaw =
        (f.fixture && f.fixture.date) ||
        f.date_utc ||
        f.date ||
        f.timestamp ||
        null;
      const dateObj = dateRaw ? new Date(dateRaw) : null;
      const date = dateObj ? dateObj.getTime() : null;
      const goals = getGoalsForMode(f, mode);
      if (!goals || date == null) return null;
      return {
        date,
        value: (goals.home ?? 0) + (goals.away ?? 0),
      };
    })
    .filter((entry) => entry && entry.date != null) as SeriesEntry[];

  mapped.sort((a, b) => a.date - b.date);
  return mapped;
}

function computeNextMatchBelow(entries: SeriesEntry[], threshold: number) {
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

function NextMatchBelowTotalCard({
  entries,
  threshold,
}: {
  entries: SeriesEntry[];
  threshold: number;
}) {
  const summary = useMemo(
    () => computeNextMatchBelow(entries, threshold),
    [entries, threshold]
  );
  const thresholdLabel = `+${formatNumber(threshold)}`;
  const showPercent = summary.lastAbove && summary.triggers > 0;
  const percentLabel = showPercent ? `${summary.percent}%` : "--";
  const detailLabel = summary.triggers
    ? `${summary.percent}% (${summary.belowNext}/${summary.triggers}) des matchs suivants se sont termines avec un total de buts inferieur a ${thresholdLabel}`
    : `Aucun match au-dessus de ${thresholdLabel}`;

  return (
    <div className="bg-white/5 rounded-xl p-6 shadow flex flex-col gap-4 h-[20rem]">
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
                  <svg
                    viewBox="0 0 20 20"
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      d="M4 10l3 3 8-8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 20 20"
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      d="M5 5l10 10M15 5l-10 10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
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
          Dernier total de buts :{" "}
          {summary.lastValue === null ? "--" : formatNumber(summary.lastValue)}
        </div>
      </div>
    </div>
  );
}

export default function GoalsTotalTrendSection({
  fixtures,
  opponentFixtures = [],
  opponentName = "Adversaire",
  referenceCount = 0,
  mode = "FT",
  onAiPrompt,
  cardBorderClass = "",
}: {
  fixtures: Fixture[];
  opponentFixtures?: Fixture[];
  opponentName?: string;
  referenceCount?: number;
  mode?: Mode;
  onAiPrompt?: (cardTitle: string, detail?: string) => void;
  cardBorderClass?: string;
}) {
  const [threshold, setThreshold] = useState(3.5);
  const entries = useMemo(() => buildEntries(fixtures ?? [], mode), [fixtures, mode]);
  const thresholdLabel = `+${formatNumber(threshold)}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-center gap-2 md:hidden" aria-hidden="true">
        <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
      </div>
      <div className="flex flex-nowrap gap-6 overflow-x-auto no-scrollbar snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible">
        <div className="order-2 md:order-1 snap-start shrink-0 w-full md:w-auto md:col-span-1">
          <div className="space-y-2">
            {onAiPrompt ? (
              <AiPromptButton
                onClick={() =>
                  onAiPrompt(
                    `Match suivant sous ${thresholdLabel}`,
                    `Total buts | Seuil ${thresholdLabel}`
                  )
                }
              />
            ) : null}
            <div className={cardBorderClass}>
              <NextMatchBelowTotalCard entries={entries} threshold={threshold} />
            </div>
          </div>
        </div>
        <div className="order-1 md:order-2 snap-start shrink-0 w-full md:w-auto md:col-span-2">
          <div className="space-y-2">
            {onAiPrompt ? (
              <AiPromptButton
                onClick={() =>
                  onAiPrompt(
                    "Tendance buts (total par match)",
                    `Total buts | Seuil ${thresholdLabel}`
                  )
                }
              />
            ) : null}
            <div className={cardBorderClass}>
              <GoalsTrendCard
                fixtures={fixtures ?? []}
                opponentFixtures={opponentFixtures}
                opponentName={opponentName}
                referenceCount={referenceCount}
                mode={mode}
                threshold={threshold}
                onThresholdChange={setThreshold}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
