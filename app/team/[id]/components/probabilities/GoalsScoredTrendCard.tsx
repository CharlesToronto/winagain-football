"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Fixture = any;
export type Mode = "FT" | "HT" | "2H";
export type Location = "all" | "home" | "away";

const MAX_GOALS = 8;
const THEME_GREEN = "#2dd4bf";
const THEME_GREEN_SOFT = "rgba(45, 212, 191, 0.18)";
const THEME_ORANGE = "#fb923c";
const THEME_ORANGE_LIGHT = "rgba(251, 146, 60, 0.6)";
const THEME_PINK = "#ff4fd8";
const THRESHOLD_OPTIONS = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function formatNumber(n: number) {
  if (Number.isNaN(n)) return "--";
  const rounded = Math.round(n * 100) / 100;
  return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(2);
}

export function getGoalsForMode(f: Fixture, mode: Mode) {
  if (mode === "HT") {
    const home = f?.goals_home_ht;
    const away = f?.goals_away_ht;
    if (home == null || away == null) return null;
    return { home, away };
  }
  if (mode === "2H") {
    const ftHome = f?.goals_home;
    const ftAway = f?.goals_away;
    const htHome = f?.goals_home_ht;
    const htAway = f?.goals_away_ht;
    if (ftHome == null || ftAway == null || htHome == null || htAway == null) return null;
    return {
      home: Math.max(0, ftHome - htHome),
      away: Math.max(0, ftAway - htAway),
    };
  }
  const home = f?.goals_home;
  const away = f?.goals_away;
  if (home == null || away == null) return null;
  return { home, away };
}

export function resolveIsHome(f: Fixture) {
  if (typeof f?.isHome === "boolean") return f.isHome;
  if (typeof f?.home_team_id === "number" && typeof f?.team_id === "number") {
    return f.home_team_id === f.team_id;
  }
  return null;
}

export function matchesLocation(isHome: boolean | null, location: Location) {
  if (location === "all") return true;
  if (isHome == null) return false;
  return location === "home" ? isHome : !isHome;
}

export type SeriesEntry = {
  date: number;
  value: number;
  tooltip: {
    date?: string;
    opponent?: string;
    score?: string;
  };
};

type BarPoint = {
  x: number;
  y: number;
  width: number;
  height: number;
  value: number;
  tooltip: SeriesEntry["tooltip"];
};

export function buildEntries(fixtures: Fixture[], mode: Mode, location: Location) {
  const mapped = (fixtures ?? [])
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
      if (!goals) return null;
      const isHome = resolveIsHome(f);
      if (!matchesLocation(isHome, location)) return null;
      if (isHome == null) return null;
      const opponent = isHome
        ? f.away_team_name ?? f.opp?.name
        : f.home_team_name ?? f.teams?.name;
      return {
        date,
        value: isHome ? goals.home : goals.away,
        tooltip: {
          date: dateObj ? dateObj.toLocaleDateString("fr-FR") : undefined,
          opponent: opponent ?? undefined,
          score: `${goals.home}-${goals.away}`,
        },
      };
    })
    .filter((entry) => entry && entry.date != null) as SeriesEntry[];

  mapped.sort((a, b) => a.date - b.date);
  return mapped;
}

function padEntries(entries: SeriesEntry[], totalSlots: number) {
  if (totalSlots <= 0) return [];
  if (entries.length >= totalSlots) {
    return entries.slice(entries.length - totalSlots);
  }
  const padding = Array.from({ length: totalSlots - entries.length }, () => null);
  return [...padding, ...entries];
}

function buildBars(entries: (SeriesEntry | null)[], totalSlots: number) {
  const viewWidth = 100;
  const viewHeight = 100;
  const slotWidth = totalSlots ? viewWidth / totalSlots : viewWidth;
  const barWidth = Math.max(0.8, slotWidth * 0.65);

  const bars: (BarPoint | null)[] = entries.map((entry, idx) => {
    if (!entry) return null;
    const value = clamp(entry.value, 0, MAX_GOALS);
    const height = (value / MAX_GOALS) * viewHeight;
    const x = idx * slotWidth + (slotWidth - barWidth) / 2;
    const y = viewHeight - height;
    return {
      x: x + barWidth / 2,
      y,
      width: barWidth,
      height,
      value,
      tooltip: entry.tooltip,
    };
  });

  return { bars, barWidth, slotWidth };
}

export default function GoalsScoredTrendCard({
  fixtures,
  opponentFixtures = [],
  opponentName = "Adversaire",
  referenceCount = 0,
  mode = "FT",
  teamName,
  threshold: controlledThreshold,
  onThresholdChange,
  location: controlledLocation,
  onLocationChange,
}: {
  fixtures: Fixture[];
  opponentFixtures?: Fixture[];
  opponentName?: string;
  referenceCount?: number;
  mode?: Mode;
  teamName?: string | null;
  threshold?: number;
  onThresholdChange?: (value: number) => void;
  location?: Location;
  onLocationChange?: (value: Location) => void;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [showOpponent, setShowOpponent] = useState(false);
  const [localThreshold, setLocalThreshold] = useState(3.5);
  const [isThresholdOpen, setIsThresholdOpen] = useState(false);
  const [localLocation, setLocalLocation] = useState<Location>("all");
  const thresholdRef = useRef<HTMLDivElement | null>(null);
  const isThresholdControlled = typeof controlledThreshold === "number";
  const isLocationControlled = typeof controlledLocation === "string";
  const threshold = typeof controlledThreshold === "number" ? controlledThreshold : localThreshold;
  const location = controlledLocation ?? localLocation;

  const setThresholdValue = (value: number) => {
    if (onThresholdChange) onThresholdChange(value);
    if (!isThresholdControlled) {
      setLocalThreshold(value);
    }
  };

  const setLocationValue = (value: Location) => {
    if (onLocationChange) onLocationChange(value);
    if (!isLocationControlled) {
      setLocalLocation(value);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!thresholdRef.current) return;
      if (!thresholdRef.current.contains(event.target as Node)) {
        setIsThresholdOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setHoverIdx(null);
  }, [fixtures, mode, location]);

  const { points, avg, total } = useMemo(() => {
    const entries = buildEntries(fixtures ?? [], mode, location);
    const values = entries.map((e) => clamp(e.value, 0, MAX_GOALS));
    const sum = values.reduce((acc, v) => acc + v, 0);
    const avg = values.length ? sum / values.length : 0;

    const totalSlots = entries.length;
    const { bars } = buildBars(entries, totalSlots);
    const points = bars
      .map((bar, idx) => {
        if (!bar || !entries[idx]) return null;
        return {
          ...bar,
          tooltip: entries[idx].tooltip,
        };
      })
      .filter(Boolean) as BarPoint[];

    return { points, avg, total: entries.length };
  }, [fixtures, mode, location]);

  const opponentSeries = useMemo(() => {
    const entries = buildEntries(opponentFixtures ?? [], mode, location);
    const limited =
      referenceCount > 0 && entries.length > referenceCount
        ? entries.slice(entries.length - referenceCount)
        : entries;
    const sum = limited.reduce((acc, entry) => acc + clamp(entry.value, 0, MAX_GOALS), 0);
    const avg = limited.length ? sum / limited.length : 0;
    const totalSlots = total || limited.length;
    const padded = padEntries(limited, totalSlots);
    const { bars } = buildBars(padded, totalSlots);
    return { bars, avg, total: limited.length };
  }, [opponentFixtures, mode, location, referenceCount, total]);

  const viewHeight = 100;
  const viewWidth = 100;
  const avgY = points.length
    ? viewHeight - (clamp(avg, 0, MAX_GOALS) / MAX_GOALS) * viewHeight
    : viewHeight;
  const thresholdY =
    viewHeight - (clamp(threshold, 0, MAX_GOALS) / MAX_GOALS) * viewHeight;

  const hoveredPoint = hoverIdx !== null ? points[hoverIdx] : null;
  const hoveredOpponent =
    hoverIdx !== null && opponentSeries.bars[hoverIdx]
      ? opponentSeries.bars[hoverIdx]
      : null;
  const resolvedTeamName = teamName || "Equipe";

  return (
    <div className="bg-white/5 rounded-xl p-6 shadow md:col-span-2 h-[20rem] flex flex-col">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h3 className="font-semibold">Tendance buts {resolvedTeamName}</h3>
          <p className="text-xs text-white/70">Serie de {total} match(s)</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            {([
              { key: "all", label: "General" },
              { key: "home", label: "Home" },
              { key: "away", label: "Away" },
            ] as { key: Location; label: string }[]).map((item) => (
              <button
                key={item.key}
                onClick={() => setLocationValue(item.key)}
                className={`px-3 py-1 text-xs rounded-md ${
                  location === item.key ? "bg-green-600 text-white" : "bg-white/10 text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-white/70">
            <span>Nouvelle moyenne</span>
            <div className="relative" ref={thresholdRef}>
              <button
                type="button"
                className="px-3 py-1 rounded-md text-xs font-semibold bg-white/10 text-white border border-white/10 backdrop-blur-sm"
                onClick={() => setIsThresholdOpen((open) => !open)}
                aria-haspopup="listbox"
                aria-expanded={isThresholdOpen}
                aria-label="Nouvelle moyenne"
              >
                {threshold}
              </button>
              {isThresholdOpen && (
                <div
                  className="absolute left-0 mt-1 min-w-full rounded-md border border-white/10 bg-white/10 text-white backdrop-blur-md shadow-lg z-20"
                  role="listbox"
                  aria-label="Nouvelle moyenne"
                >
                  {THRESHOLD_OPTIONS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      role="option"
                      aria-selected={value === threshold}
                      className={`w-full px-3 py-1 text-left text-xs font-semibold ${
                        value === threshold ? "bg-white/20" : "bg-white/0"
                      } hover:bg-white/20`}
                      onClick={() => {
                        setThresholdValue(value);
                        setIsThresholdOpen(false);
                      }}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowOpponent((v) => !v)}
            disabled={!opponentFixtures || opponentFixtures.length === 0}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
              showOpponent
                ? "bg-orange-500 text-white"
                : "bg-white/10 text-white hover:bg-white/20"
            } ${
              !opponentFixtures || opponentFixtures.length === 0
                ? "opacity-40 cursor-not-allowed"
                : ""
            }`}
          >
            Adversaire
          </button>
        </div>
      </div>

      {points.length === 0 ? (
        <p className="text-sm text-white/70">Aucune donnee disponible.</p>
      ) : (
        <div className="relative w-full flex-1 min-h-0 select-none">
          <svg
            viewBox={`0 0 ${viewWidth} ${viewHeight}`}
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            {Array.from({ length: MAX_GOALS - 2 }).map((_, idx) => {
              const label = idx + 1;
              const y = viewHeight - (label / MAX_GOALS) * viewHeight;
              return (
                <g key={label}>
                  <line
                    x1={0}
                    y1={y}
                    x2={viewWidth}
                    y2={y}
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth={0.4}
                  />
                  <text
                    x={-4}
                    y={y + 1.8}
                    fontSize={4}
                    fill="rgba(255,255,255,0.55)"
                  >
                    {label}
                  </text>
                </g>
              );
            })}

            <line
              x1={0}
              y1={avgY}
              x2={viewWidth}
              y2={avgY}
              stroke="rgba(255,255,255,0.7)"
              strokeWidth={0.8}
              strokeDasharray="1 1"
            />
            <line
              x1={0}
              y1={thresholdY}
              x2={viewWidth}
              y2={thresholdY}
              stroke={THEME_PINK}
              strokeWidth={0.6}
            />
            {showOpponent && opponentSeries.bars.length > 0 && (
              <line
                x1={0}
                y1={viewHeight - (clamp(opponentSeries.avg, 0, MAX_GOALS) / MAX_GOALS) * viewHeight}
                x2={viewWidth}
                y2={viewHeight - (clamp(opponentSeries.avg, 0, MAX_GOALS) / MAX_GOALS) * viewHeight}
                stroke={THEME_ORANGE_LIGHT}
                strokeWidth={0.4}
                strokeDasharray="1 1"
              />
            )}

            <defs>
              <linearGradient id="goalsBars" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={THEME_GREEN} stopOpacity="0.9" />
                <stop offset="100%" stopColor={THEME_GREEN} stopOpacity="0.15" />
              </linearGradient>
              <linearGradient id="opponentBars" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={THEME_ORANGE} stopOpacity="0.7" />
                <stop offset="100%" stopColor={THEME_ORANGE} stopOpacity="0.1" />
              </linearGradient>
            </defs>

            {hoveredPoint && (
              <rect
                x={hoveredPoint.x - hoveredPoint.width / 2}
                y={0}
                width={hoveredPoint.width}
                height={viewHeight}
                fill={THEME_GREEN_SOFT}
              />
            )}

            {showOpponent &&
              opponentSeries.bars.map((bar, idx) => {
                if (!bar) return null;
                return (
                  <rect
                    key={`opp-${idx}`}
                    x={bar.x - bar.width / 2}
                    y={bar.y}
                    width={bar.width}
                    height={bar.height}
                    fill="url(#opponentBars)"
                    opacity={0.5}
                    rx={0.6}
                  />
                );
              })}

            {points.map((bar, idx) => (
              <rect
                key={`main-${idx}`}
                x={bar.x - bar.width / 2}
                y={bar.y}
                width={bar.width}
                height={bar.height}
                fill="url(#goalsBars)"
                rx={0.6}
              />
            ))}
          </svg>

          <div
            className="absolute inset-0"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * viewWidth;
              let nearest = 0;
              let best = Infinity;
              points.forEach((p, idx) => {
                const dist = Math.abs(p.x - x);
                if (dist < best) {
                  best = dist;
                  nearest = idx;
                }
              });
              setHoverIdx(nearest);
            }}
            onMouseLeave={() => setHoverIdx(null)}
          />

          {hoveredPoint && (
            <div
              className="absolute px-3 py-2 bg-black/70 text-white text-xs rounded-lg border border-white/10"
              style={{
                left: `${(hoveredPoint.x / viewWidth) * 100}%`,
                top: `${(hoveredPoint.y / viewHeight) * 100}%`,
                transform: "translate(-50%, -110%)",
                pointerEvents: "none",
                whiteSpace: "nowrap",
              }}
            >
              <div className="font-semibold">
                Match {hoverIdx !== null ? hoverIdx + 1 : ""}
              </div>
              {hoveredPoint.tooltip.date && (
                <div className="opacity-80">{hoveredPoint.tooltip.date}</div>
              )}
              {hoveredPoint.tooltip.opponent && (
                <div className="opacity-80">vs {hoveredPoint.tooltip.opponent}</div>
              )}
              {hoveredPoint.tooltip.score && (
                <div className="opacity-80">Score : {hoveredPoint.tooltip.score}</div>
              )}
              <div className="mt-1 text-green-300">
                Buts Marqués : {formatNumber(hoveredPoint.value)}
              </div>
              {showOpponent && hoveredOpponent && (
                <div className="mt-1 text-orange-300">
                  Adversaire : {formatNumber(hoveredOpponent.value)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center gap-4 text-xs text-white/70">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-green-400 inline-block" />
          <span>Buts Marqués par match</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-white/80 inline-block" />
          <span>Moyenne ({formatNumber(avg)})</span>
        </div>
        {showOpponent && (
          <>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-orange-400 inline-block" />
              <span>{opponentName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 bg-orange-300 inline-block" />
              <span>Moyenne {opponentName} ({formatNumber(opponentSeries.avg)})</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
