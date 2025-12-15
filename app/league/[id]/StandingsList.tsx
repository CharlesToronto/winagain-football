"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type StandingRow = {
  rank: number;
  team: { id: number; name: string; logo?: string };
  all?: { played?: number; win?: number; draw?: number; lose?: number };
  points?: number;
};

type Props = {
  table: StandingRow[];
  opponentByTeam: Record<number, number | undefined>;
};

export default function StandingsList({ table, opponentByTeam }: Props) {
  const [hoveredTeam, setHoveredTeam] = useState<number | null>(null);

  const hoveredOpponent = useMemo(() => {
    if (!hoveredTeam) return null;
    return opponentByTeam[hoveredTeam] ?? null;
  }, [hoveredTeam, opponentByTeam]);

  return (
    <div className="grid gap-2">
      {table.map((row) => {
        const teamId = row.team?.id;
        const isHovered = hoveredTeam === teamId;
        const isOpponent = hoveredOpponent === teamId;
        const highlight = isHovered || isOpponent;

        return (
          <Link
            href={`/team/${teamId}`}
            key={teamId}
            onMouseEnter={() => setHoveredTeam(teamId ?? null)}
            onMouseLeave={() => setHoveredTeam(null)}
            className={`flex items-center justify-between rounded-lg border px-3 py-2 transition-colors ${
              highlight
                ? "bg-white/10 border-white/30"
                : "border-white/10 hover:border-white/20 hover:bg-white/5"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold w-6 text-center">{row.rank}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {row.team?.logo && (
                <img
                  src={row.team.logo}
                  alt={row.team.name}
                  className="h-8 w-8 object-contain"
                />
              )}
              <div>
                <div className="font-semibold">{row.team?.name}</div>
                <div className="text-xs text-white/70">Played: {row.all?.played ?? "-"}</div>
              </div>
            </div>

            <div className="text-sm text-white/80 flex gap-4">
              <span>W: {row.all?.win ?? "-"}</span>
              <span>D: {row.all?.draw ?? "-"}</span>
              <span>L: {row.all?.lose ?? "-"}</span>
              <span className="font-bold text-white">Pts: {row.points ?? "-"}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
