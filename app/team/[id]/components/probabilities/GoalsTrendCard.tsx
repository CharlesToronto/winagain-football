"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Fixture = any;
type Mode = "FT" | "HT" | "2H";

const THEME_GREEN = "#2dd4bf"; // turquoise doux
const THEME_GREEN_DARK = "rgba(45, 212, 191, 0.18)";
const THEME_BLUE = "rgba(255,255,255,0.35)"; // neutre clair pour la moyenne
const THEME_ORANGE = "#fb923c";
const THEME_ORANGE_LIGHT = "rgba(251, 146, 60, 0.6)";
const THEME_PINK = "#ff4fd8";
const THRESHOLD_OPTIONS = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function formatNumber(n: number) {
  if (Number.isNaN(n)) return "–";
  const rounded = Math.round(n * 100) / 100;
  return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(2);
}

type Point = {
  x: number;
  y: number;
  label: string;
  value: number;
  tooltip: {
    date?: string;
    opponent?: string;
    score?: string;
  };
};

function toPath(points: Point[]) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;

  const p = points;
  const d = [];
  d.push(`M ${p[0].x},${p[0].y}`);
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i === 0 ? i : i - 1];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2 < p.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d.push(`C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`);
  }
  return d.join(" ");
}

function getGoalsForMode(f: Fixture, mode: Mode) {
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

export default function GoalsTrendCard({
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
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [showOpponent, setShowOpponent] = useState(false);
  const [threshold, setThreshold] = useState(3.5);
  const [isThresholdOpen, setIsThresholdOpen] = useState(false);
  const thresholdRef = useRef<HTMLDivElement | null>(null);

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

  const { points, avg, total } = useMemo(() => {
    const usable = (fixtures ?? [])
      .map((f, idx) => {
        const dateRaw =
          (f.fixture && f.fixture.date) ||
          f.date_utc ||
          f.date ||
          f.timestamp ||
          null;
        const dateObj = dateRaw ? new Date(dateRaw) : null;
        const date = dateObj ? dateObj.getTime() : null;
        const goals = getGoalsForMode(f, mode);
        if (!goals) return null; // on ignore les matchs sans score
        const { home, away } = goals;
        const isHome = f.isHome ?? f.home_team_id === f.team_id;
        const opponent =
          isHome ? f.away_team_name ?? f.opp?.name : f.home_team_name ?? f.teams?.name;
        const score = `${home}-${away}`;
        return {
          date,
          totalGoals: home + away,
          tooltip: {
            date: dateObj ? dateObj.toLocaleDateString("fr-FR") : undefined,
            opponent: opponent ?? undefined,
            score,
          },
          idx,
        };
      })
      .filter((f) => f !== null && f.date !== null)
      .sort((a, b) => (a.date ?? 0) - (b.date ?? 0));

    const totals = usable.map((u) => clamp(u.totalGoals, 0, 8));
    const sum = totals.reduce((acc, v) => acc + v, 0);
    const avg = totals.length ? sum / totals.length : 0;

    const viewW = 100;
    const viewH = 100;
    const pts: Point[] = totals.map((v, i) => ({
      x: totals.length <= 1 ? 0 : (i / (totals.length - 1)) * viewW,
      y: viewH - (clamp(v, 0, 8) / 8) * viewH,
      label: `${i + 1}`,
      value: v,
      tooltip: usable[i]?.tooltip ?? {},
    }));

    return { points: pts, avg, total: totals.length };
  }, [fixtures, mode]);

  const viewHeight = 100;
  const viewWidth = 100;
  const avgY = points.length ? viewHeight - (clamp(avg, 0, 8) / 8) * viewHeight : viewHeight;
  const thresholdY =
    viewHeight - (clamp(threshold, 0, 8) / 8) * viewHeight;

  const hoveredPoint = hoverIdx !== null && points[hoverIdx] ? points[hoverIdx] : null;
  const opponentSeries = useMemo(() => {
    const usableRaw = (opponentFixtures ?? [])
      .map((f, idx) => {
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
        const { home, away } = goals;
        return {
          date,
          totalGoals: home + away,
          tooltip: {
            date: dateObj ? dateObj.toLocaleDateString("fr-FR") : undefined,
            score: `${home}-${away}`,
          },
          idx,
        };
      })
      .filter((f) => f !== null && f.date !== null)
      .sort((a, b) => (a.date ?? 0) - (b.date ?? 0));

    const usable =
      referenceCount > 0 && usableRaw.length > referenceCount
        ? usableRaw.slice(usableRaw.length - referenceCount)
        : usableRaw;

    const totals = usable.map((u) => clamp(u.totalGoals, 0, 8));
    const sum = totals.reduce((acc, v) => acc + v, 0);
    const avg = totals.length ? sum / totals.length : 0;

    const viewW = 100;
    const viewH = 100;
    const pts: Point[] = totals.map((v, i) => ({
      x: totals.length <= 1 ? 0 : (i / (totals.length - 1)) * viewW,
      y: viewH - (clamp(v, 0, 8) / 8) * viewH,
      label: `${i + 1}`,
      value: v,
      tooltip: usable[i]?.tooltip ?? {},
    }));

    return { points: pts, avg, total: totals.length };
  }, [opponentFixtures, referenceCount, mode]);

  const hoveredOpponent =
    hoverIdx !== null && opponentSeries.points[hoverIdx]
      ? opponentSeries.points[hoverIdx]
      : null;

  return (
    <div className="bg-white/5 rounded-xl p-6 shadow md:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">Tendance buts (total par match)</h3>
          <p className="text-xs text-white/70">Série de {total} match(s)</p>
        </div>
        <div className="flex items-center gap-2">
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
                        setThreshold(value);
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
        <p className="text-sm text-white/70">Aucune donnée disponible.</p>
      ) : (
        <div className="relative w-full h-60 select-none">
          <svg
            viewBox={`0 0 ${viewWidth} ${viewHeight}`}
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            {/* Grille Y 0..8 */}
            {Array.from({ length: 8 }).map((_, idx) => {
              const label = idx + 1;
              const y = viewHeight - (label / 8) * viewHeight;
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

            {/* Ligne moyenne */}
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
            {showOpponent && opponentSeries.points.length > 0 && (
              <line
                x1={0}
                y1={viewHeight - (clamp(opponentSeries.avg, 0, 8) / 8) * viewHeight}
                x2={viewWidth}
                y2={viewHeight - (clamp(opponentSeries.avg, 0, 8) / 8) * viewHeight}
                stroke={THEME_ORANGE_LIGHT}
                strokeWidth={0.4}
                strokeDasharray="1 1"
              />
            )}

            {/* Zone + courbe lissée */}
            <defs>
              <linearGradient id="goalsLineSmooth" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={THEME_GREEN} stopOpacity="0.6" />
                <stop offset="100%" stopColor={THEME_GREEN} stopOpacity="0.05" />
              </linearGradient>
            </defs>

            <path
              d={`${toPath(points)} L ${viewWidth},${viewHeight} L 0,${viewHeight} Z`}
              fill="url(#goalsLineSmooth)"
              opacity="0.6"
            />
            <path
              d={toPath(points)}
              fill="none"
              stroke={THEME_GREEN}
              strokeWidth={0.4}
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {showOpponent && opponentSeries.points.length > 0 && (
              <>
                <defs>
                  <linearGradient id="opponentLineSmooth" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={THEME_ORANGE} stopOpacity="0.35" />
                    <stop offset="100%" stopColor={THEME_ORANGE} stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                <path
                  d={`${toPath(opponentSeries.points)} L ${viewWidth},${viewHeight} L 0,${viewHeight} Z`}
                  fill="url(#opponentLineSmooth)"
                  opacity="0.5"
                />
                <path
                  d={toPath(opponentSeries.points)}
                  fill="none"
                  stroke={THEME_ORANGE}
                  strokeWidth={0.4}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </>
            )}

            {/* Points invisibles pour le hover */}
            {points.map((p, idx) => (
              <circle
                key={`main-${idx}`}
                cx={p.x}
                cy={p.y}
                r={2.2}
                fill="transparent"
                stroke="transparent"
              />
            ))}
            {showOpponent &&
              opponentSeries.points.map((p, idx) => (
                <circle
                  key={`opp-${idx}`}
                  cx={p.x}
                  cy={p.y}
                  r={2.2}
                  fill="transparent"
                  stroke="transparent"
                />
              ))}
          </svg>

          {/* Overlay hover */}
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
                Total buts : {formatNumber(hoveredPoint.value)}
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

      {points.length > 0 && (
        <div className="mt-3">
          <div className="relative w-full h-4">
            {points.map((p, idx) => {
              const left =
                points.length === 1 ? 0 : (idx / (points.length - 1)) * 100;
              return (
                <span
                  key={`idx-${idx}`}
                  className="w-2 h-2 rounded-full bg-blue-400 absolute -translate-x-1/2"
                  style={{ left: `${left}%`, top: "50%", transform: "translate(-50%, -50%)" }}
                  title={`Match ${idx + 1}`}
                />
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center gap-4 text-xs text-white/70">
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-green-400 inline-block" />
          <span>Total buts par match</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-blue-400 inline-block" />
          <span>Moyenne ({formatNumber(avg)})</span>
        </div>
        {showOpponent && (
          <>
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 bg-orange-400 inline-block" />
              <span>{opponentName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 bg-orange-200 inline-block" />
              <span>Moyenne {opponentName} ({formatNumber(opponentSeries.avg)})</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
