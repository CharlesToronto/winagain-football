"use client";

import { useEffect, useState } from "react";
import CardResultSimple from "./CardResultSimple";
import CardOverUnder from "./CardOverUnder";
import CardGoals from "./CardGoals";
import CardCorners from "./CardCorners";
import CardCards from "./CardCards";
import CardSeries from "./CardSeries";
import CardHalfFull from "./CardHalfFull";
import GoalsTrendCard from "./GoalsTrendCard";
import CardDoubleChance from "./CardDoubleChance";
import CardOverUnderHomeAway from "./CardOverUnderHomeAway";

import { getProbabilityEngines } from "@/lib/adapters/probabilities";
import Link from "next/link";
import { getTeamFixturesAllSeasons } from "@/lib/queries/fixtures";

type Fixture = any;
type FilterKey = "FT" | "HT" | "2H";

export default function ProbabilitiesView({
  fixtures,
  nextOpponentId,
  nextOpponentName,
}: {
  fixtures: Fixture[];
  nextOpponentId?: number | null;
  nextOpponentName?: string | null;
}) {
  const [filter, setFilter] = useState<FilterKey>("FT");
  const [opponentFixtures, setOpponentFixtures] = useState<Fixture[]>([]);

  const { engines, computeStreaks } = getProbabilityEngines();

  const computeEngine = engines[filter];
  const baseStats = computeEngine(fixtures ?? []);
  const streakStats = computeStreaks(fixtures ?? []);

  const stats = {
    ...baseStats,
    streaks: streakStats,
  };
  const streaks = streakStats;

  console.log("➡️ FIXTURES RECEIVED BY ProbabilitiesView:", fixtures?.length);
  console.log("➡️ CURRENT FILTER:", filter);
  console.log("➡️ BASE STATS:", baseStats);
  console.log("➡️ STREAK STATS:", streakStats);
  console.log("➡️ FINAL MERGED STATS:", stats);
  console.log("➡️ STATS SENT TO CARDS:", stats);

  useEffect(() => {
    async function loadOpponent() {
      if (!nextOpponentId) {
        setOpponentFixtures([]);
        return;
      }
      try {
        const raw = await getTeamFixturesAllSeasons(Number(nextOpponentId));
        if (!raw || raw.length === 0) {
          setOpponentFixtures([]);
          return;
        }
        const mapped = raw.map((f: any) => {
          const isHome = f.home_team_id === Number(nextOpponentId);
          return {
            ...f,
            isHome,
            goals_home: f.goals_home,
            goals_away: f.goals_away,
            home_team_name: f.teams?.name ?? f.home_team_name ?? "Unknown",
            away_team_name: f.opp?.name ?? f.away_team_name ?? "Unknown",
            fixture: { date: f.date_utc ?? f.date ?? f.timestamp ?? null },
          };
        });
        setOpponentFixtures(mapped);
      } catch (e) {
        setOpponentFixtures([]);
      }
    }
    loadOpponent();
  }, [nextOpponentId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFilter("FT")}
            className={`px-4 py-2 rounded-md ${
              filter === "FT" ? "bg-green-600 text-white" : "bg-white/10"
            }`}
          >
            Full Game
          </button>

          <button
            onClick={() => setFilter("HT")}
            className={`px-4 py-2 rounded-md ${
              filter === "HT" ? "bg-green-600 text-white" : "bg-white/10"
            }`}
          >
            1 Half
          </button>

          <button
            onClick={() => setFilter("2H")}
            className={`px-4 py-2 rounded-md ${
              filter === "2H" ? "bg-green-600 text-white" : "bg-white/10"
            }`}
          >
            2 Half
          </button>
        </div>

        {nextOpponentId ? (
          <Link
            href={`/team/${nextOpponentId}`}
            className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-sm font-semibold transition"
          >
            Visualiser le prochain adversaire
          </Link>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CardResultSimple data={stats} streaks={streaks} />
        <CardDoubleChance data={stats} streaks={streaks} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CardOverUnder data={stats} streaks={streaks} />
        <CardOverUnderHomeAway fixtures={fixtures ?? []} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GoalsTrendCard
          fixtures={fixtures ?? []}
          opponentFixtures={opponentFixtures}
          opponentName={nextOpponentName ?? "Adversaire"}
          referenceCount={fixtures?.length ?? 0}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <CardGoals data={stats} streaks={streaks} />
        <CardCorners data={stats} streaks={streaks} />
        <CardCards data={stats} streaks={streaks} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <CardSeries data={stats} streaks={streaks} />
        <CardHalfFull data={stats} streaks={streaks} />
      </div>

      <div className="mt-6 p-4 rounded-lg bg-white/10 text-white text-sm">
        Mode sélectionné : {filter}
        <br />
        Matchs utilisés : {fixtures?.length ?? 0}
      </div>
    </div>
  );
}
