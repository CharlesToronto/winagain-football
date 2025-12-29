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
import CardGoalsSplit from "./CardGoalsSplit";

import { getProbabilityEngines } from "@/lib/adapters/probabilities";
import { getTeamFixturesAllSeasons } from "@/lib/queries/fixtures";
import { useRouter } from "next/navigation";

type Fixture = any;
type FilterKey = "FT" | "HT" | "2H";

type RangeOption = number | "season";

const CURRENT_SEASON = 2025;

function selectOpponentFixtures(fixtures: Fixture[], range?: RangeOption) {
  let played = fixtures.filter((f) => f.goals_home !== null && f.goals_away !== null);

  if (range === "season") {
    played = played.filter((f) => f.season === CURRENT_SEASON);
  }

  played.sort(
    (a, b) => new Date(b.date_utc).getTime() - new Date(a.date_utc).getTime()
  );

  const selectedCount = range === "season" || range == null ? played.length : range;
  return played.slice(0, selectedCount);
}


export default function ProbabilitiesView({
  fixtures,
  nextOpponentId,
  nextOpponentName,
  range,
  overUnderMatchKeys,
  overUnderHighlight,
}: {
  fixtures: Fixture[];
  nextOpponentId?: number | null;
  nextOpponentName?: string | null;
  range?: RangeOption;
  overUnderMatchKeys?: Set<string>;
  overUnderHighlight?: boolean;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("FT");
  const [showOpponentComparison, setShowOpponentComparison] = useState(false);
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
  const opponentStats =
    showOpponentComparison && opponentFixtures.length > 0
      ? computeEngine(opponentFixtures ?? [])
      : null;

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
        const filtered = selectOpponentFixtures(raw, range);
        if (!filtered || filtered.length === 0) {
          setOpponentFixtures([]);
          return;
        }
        const mapped = filtered.map((f: any) => {
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
  }, [nextOpponentId, range]);

  useEffect(() => {
    setShowOpponentComparison(false);
  }, [nextOpponentId]);

  const handleOpponentClick = () => {
    if (!nextOpponentId) return;
    if (!showOpponentComparison) {
      setShowOpponentComparison(true);
      return;
    }
    router.push(`/team/${nextOpponentId}?tab=stats`);
  };

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
          <button
            type="button"
            onClick={handleOpponentClick}
            className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-sm font-semibold transition"
          >
            Visualiser le prochain adversaire
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CardResultSimple data={stats} streaks={streaks} opponentData={opponentStats} />
        <CardGoalsSplit fixtures={fixtures ?? []} />
        <CardDoubleChance
          data={stats}
          streaks={streaks}
          opponentData={opponentStats}
          highlightKeys={overUnderMatchKeys}
          highlightActive={overUnderHighlight}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CardOverUnder
          data={stats}
          streaks={streaks}
          opponentData={opponentStats}
          highlightKeys={overUnderMatchKeys}
          highlightActive={overUnderHighlight}
        />
        <CardOverUnderHomeAway
          fixtures={fixtures ?? []}
          opponentFixtures={opponentFixtures}
          showOpponentComparison={showOpponentComparison}
          highlightKeys={overUnderMatchKeys}
          highlightActive={overUnderHighlight}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GoalsTrendCard
          fixtures={fixtures ?? []}
          opponentFixtures={opponentFixtures}
          opponentName={nextOpponentName ?? "Adversaire"}
          referenceCount={fixtures?.length ?? 0}
          mode={filter}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <CardGoals data={stats} streaks={streaks} opponentData={opponentStats} />
        <CardCorners data={stats} streaks={streaks} opponentData={opponentStats} />
        <CardCards data={stats} streaks={streaks} opponentData={opponentStats} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <CardSeries data={stats} streaks={streaks} opponentData={opponentStats} />
        <CardHalfFull data={stats} streaks={streaks} opponentData={opponentStats} />
      </div>

      <div className="mt-6 p-4 rounded-lg bg-white/10 text-white text-sm">
        Mode sélectionné : {filter}
        <br />
        Matchs utilisés : {fixtures?.length ?? 0}
      </div>
    </div>
  );
}
