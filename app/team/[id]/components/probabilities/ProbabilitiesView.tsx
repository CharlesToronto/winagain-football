"use client";

import { useEffect, useState } from "react";
import CardResultSimple from "./CardResultSimple";
import CardOverUnder from "./CardOverUnder";
import CardCorners from "./CardCorners";
import CardCards from "./CardCards";
import CardSeries from "./CardSeries";
import CardHalfFull from "./CardHalfFull";
import GoalsTotalTrendSection from "./GoalsTotalTrendSection";
import GoalsScoredTrendSection from "./GoalsScoredTrendSection";
import CardDoubleChance from "./CardDoubleChance";
import CardOverUnderHomeAway from "./CardOverUnderHomeAway";
import CardGoalsSplit from "./CardGoalsSplit";
import AiPromptButton from "./AiPromptButton";

import { getProbabilityEngines } from "@/lib/adapters/probabilities";
import { getTeamFixturesAllSeasons } from "@/lib/queries/fixtures";
import { usePathname, useRouter } from "next/navigation";

type Fixture = any;
type FilterKey = "FT" | "HT" | "2H";

type RangeOption = number | "season";

const CURRENT_SEASON = 2025;

function selectOpponentFixtures(
  fixtures: Fixture[],
  range?: RangeOption,
  cutoffDate?: Date | null
) {
  let played = fixtures.filter((f) => f.goals_home !== null && f.goals_away !== null);

  if (range === "season") {
    played = played.filter((f) => f.season === CURRENT_SEASON);
  }

  if (cutoffDate) {
    const cutoffTime = cutoffDate.getTime();
    played = played.filter((f) => {
      const raw = f.date_utc ?? f.date ?? f.timestamp ?? null;
      if (!raw) return false;
      const time = new Date(raw).getTime();
      return Number.isFinite(time) && time <= cutoffTime;
    });
  }

  played.sort(
    (a, b) => new Date(b.date_utc).getTime() - new Date(a.date_utc).getTime()
  );

  const selectedCount = range === "season" || range == null ? played.length : range;
  return played.slice(0, selectedCount);
}


export default function ProbabilitiesView({
  fixtures,
  teamId,
  nextOpponentId,
  nextOpponentName,
  range,
  cutoffDate,
  overUnderMatchKeys,
  overUnderHighlight,
  filter,
  onFilterChange,
}: {
  fixtures: Fixture[];
  teamId?: number | null;
  nextOpponentId?: number | null;
  nextOpponentName?: string | null;
  range?: RangeOption;
  cutoffDate?: Date | null;
  overUnderMatchKeys?: Set<string>;
  overUnderHighlight?: boolean;
  filter: FilterKey;
  onFilterChange: (value: FilterKey) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
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
        const filtered = selectOpponentFixtures(raw, range, cutoffDate);
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
  }, [nextOpponentId, range, cutoffDate]);

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

  const handleAiPrompt = (cardTitle: string, detail?: string) => {
    if (!Number.isFinite(teamId)) return;
    const opponentLabel = nextOpponentName ?? "le prochain adversaire";
    const detailSuffix = detail ? ` Contexte: ${detail}.` : "";
    const keyPointsSuffix =
      " Termine par 3 points cles (puces) sur le prochain match de l'equipe et du prochain adversaire, ou sur leurs series en cours si les infos de match manquent.";
    const prompt = `Charly, que penses-tu des informations de la carte "${cardTitle}" (filtre ${filter}) pour l'equipe, et de la carte equivalente pour ${opponentLabel} ?${detailSuffix}${keyPointsSuffix}`;
    try {
      localStorage.setItem(
        "team-ai-pending-prompt",
        JSON.stringify({ teamId, prompt, createdAt: Date.now() })
      );
    } catch {
      // Ignore storage failures
    }
    router.push(`${pathname}?tab=dashboard`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onFilterChange("FT")}
            className={`px-4 py-2 rounded-md ${
              filter === "FT" ? "bg-green-700 text-withe" : "bg-white/10"
            }`}
          >
            Full Game
          </button>

          <button
            onClick={() => onFilterChange("HT")}
            className={`px-4 py-2 rounded-md ${
              filter === "HT" ? "bg-green-600 text-white" : "bg-white/10"
            }`}
          >
            1 Half
          </button>

          <button
            onClick={() => onFilterChange("2H")}
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

      <div className="md:hidden space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2" aria-hidden="true">
            <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
          </div>
          <div className="flex flex-nowrap gap-6 overflow-x-auto no-scrollbar snap-x snap-mandatory">
            <div className="snap-start shrink-0 w-full">
              <div className="space-y-2">
                <AiPromptButton onClick={() => handleAiPrompt("Resultats")} />
                <CardResultSimple
                  data={stats}
                  streaks={streaks}
                  opponentData={opponentStats}
                />
              </div>
            </div>
            <div className="snap-start shrink-0 w-full">
              <div className="space-y-2">
                <AiPromptButton onClick={() => handleAiPrompt("Double chance")} />
                <CardDoubleChance
                  data={stats}
                  streaks={streaks}
                  opponentData={opponentStats}
                  highlightKeys={overUnderMatchKeys}
                  highlightActive={overUnderHighlight}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <AiPromptButton onClick={() => handleAiPrompt("Buts Marqués / Encaissés")} />
          <CardGoalsSplit fixtures={fixtures ?? []} />
        </div>
      </div>

      <div className="hidden md:grid md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <AiPromptButton onClick={() => handleAiPrompt("Resultats")} />
          <CardResultSimple data={stats} streaks={streaks} opponentData={opponentStats} />
        </div>
        <div className="space-y-2">
          <AiPromptButton onClick={() => handleAiPrompt("Buts Marqués / Encaissés")} />
          <CardGoalsSplit fixtures={fixtures ?? []} />
        </div>
        <div className="space-y-2">
          <AiPromptButton onClick={() => handleAiPrompt("Double chance")} />
          <CardDoubleChance
            data={stats}
            streaks={streaks}
            opponentData={opponentStats}
            highlightKeys={overUnderMatchKeys}
            highlightActive={overUnderHighlight}
          />
        </div>
      </div>

      <GoalsScoredTrendSection
        fixtures={fixtures ?? []}
        opponentFixtures={opponentFixtures}
        opponentName={nextOpponentName ?? "Adversaire"}
        referenceCount={fixtures?.length ?? 0}
        mode={filter}
        onAiPrompt={handleAiPrompt}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <AiPromptButton onClick={() => handleAiPrompt("Over / Under")} />
          <CardOverUnder
            data={stats}
            streaks={streaks}
            opponentData={opponentStats}
            highlightKeys={overUnderMatchKeys}
            highlightActive={overUnderHighlight}
          />
        </div>
        <div className="space-y-2">
          <AiPromptButton onClick={() => handleAiPrompt("Over / Under (Home/Away)")} />
          <CardOverUnderHomeAway
            fixtures={fixtures ?? []}
            opponentFixtures={opponentFixtures}
            showOpponentComparison={showOpponentComparison}
            highlightKeys={overUnderMatchKeys}
            highlightActive={overUnderHighlight}
          />
        </div>
      </div>

      <GoalsTotalTrendSection
        fixtures={fixtures ?? []}
        opponentFixtures={opponentFixtures}
        opponentName={nextOpponentName ?? "Adversaire"}
        referenceCount={fixtures?.length ?? 0}
        mode={filter}
        onAiPrompt={handleAiPrompt}
      />

      <div className="hidden">
        <CardCorners data={stats} streaks={streaks} opponentData={opponentStats} />
      </div>
      <div className="hidden">
        <CardCards data={stats} streaks={streaks} opponentData={opponentStats} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="hidden">
          <CardSeries data={stats} streaks={streaks} opponentData={opponentStats} />
        </div>
        <div className="hidden">
          <CardHalfFull data={stats} streaks={streaks} opponentData={opponentStats} />
        </div>
      </div>

      <div className="mt-6 p-4 rounded-lg bg-white/10 text-white text-sm">
        Mode sélectionné : {filter}
        <br />
        Matchs utilisés : {fixtures?.length ?? 0}
      </div>
    </div>
  );
}
