"use client";

import { useEffect, useMemo, useState } from "react";
import { getFixturesForTeamsSeasons } from "@/lib/queries/fixtures";

type RangeOption = number | "season";
type SeasonFilter = "all" | "2024" | "2025";

type Fixture = {
  id: number;
  date_utc: string | null;
  season: number | string | null;
  competition_id?: number | null;
  home_team_id: number | null;
  away_team_id: number | null;
  goals_home: number | null;
  goals_away: number | null;
};
type FixtureInput = Partial<Fixture> & Record<string, any>;

type TeamFixture = {
  id: number;
  dateValue: number;
  season: number;
  competitionId: number | null;
  isHome: boolean;
  opponentId: number;
  goalsHome: number;
  goalsAway: number;
};

type BadgeBucket = {
  badgeCount: number;
  total: number;
  success: number;
};

const SEASON_OPTIONS = [2024, 2025] as const;
const TOTAL_BADGES = 7;
const SCORED_THRESHOLD = 1.5;
const TOTAL_THRESHOLD = 3.5;

function parseSeason(value: number | string | null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getDateValue(value: string | null) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

function getGoalsScored(match: TeamFixture) {
  return match.isHome ? match.goalsHome : match.goalsAway;
}

function getGoalsTotal(match: TeamFixture) {
  return match.goalsHome + match.goalsAway;
}

function computeNextMatchBelow(values: number[], threshold: number) {
  if (values.length === 0) {
    return { lastAbove: false, triggers: 0, percent: 0 };
  }
  let triggers = 0;
  let belowNext = 0;
  for (let i = 0; i < values.length - 1; i += 1) {
    if (values[i] > threshold) {
      triggers += 1;
      if (values[i + 1] < threshold) {
        belowNext += 1;
      }
    }
  }
  const percent = triggers ? Math.round((belowNext / triggers) * 100) : 0;
  const lastValue = values[values.length - 1];
  return {
    lastAbove: lastValue > threshold,
    triggers,
    percent,
  };
}

function percentUnder(values: number[], threshold: number) {
  if (!values.length) return null;
  const underCount = values.filter((value) => value <= threshold).length;
  return Math.round((underCount / values.length) * 100);
}

function isBetween70And99(value: number | null) {
  return value != null && value >= 70 && value <= 99;
}

function rangeLabel(range?: RangeOption) {
  if (typeof range === "number") return `${range} matchs`;
  if (range === "season") return "tous les matchs";
  return "tous les matchs";
}

function buildTeamFixtureMap(
  fixtures: FixtureInput[],
  seasons: number[],
  leagueId?: number | null
) {
  const map = new Map<number, TeamFixture[]>();
  const seasonSet = new Set(seasons);

  for (const fixture of fixtures ?? []) {
    const season = parseSeason(fixture.season);
    if (season == null || !seasonSet.has(season)) continue;
    if (leagueId != null) {
      if (fixture.competition_id == null) continue;
      if (Number(fixture.competition_id) !== Number(leagueId)) continue;
    }
    const dateValue = getDateValue(fixture.date_utc);
    if (dateValue == null) continue;
    if (fixture.goals_home == null || fixture.goals_away == null) continue;
    if (fixture.home_team_id == null || fixture.away_team_id == null) continue;

    const homeId = Number(fixture.home_team_id);
    const awayId = Number(fixture.away_team_id);
    if (!Number.isFinite(homeId) || !Number.isFinite(awayId)) continue;
    const goalsHome = Number(fixture.goals_home);
    const goalsAway = Number(fixture.goals_away);
    const competitionId =
      fixture.competition_id != null ? Number(fixture.competition_id) : null;

    const homeEntry: TeamFixture = {
      id: fixture.id,
      dateValue,
      season,
      competitionId,
      isHome: true,
      opponentId: awayId,
      goalsHome,
      goalsAway,
    };
    const awayEntry: TeamFixture = {
      id: fixture.id,
      dateValue,
      season,
      competitionId,
      isHome: false,
      opponentId: homeId,
      goalsHome,
      goalsAway,
    };

    if (!map.has(homeId)) map.set(homeId, []);
    if (!map.has(awayId)) map.set(awayId, []);
    map.get(homeId)?.push(homeEntry);
    map.get(awayId)?.push(awayEntry);
  }

  Array.from(map.values()).forEach((list) => {
    list.sort((a, b) => a.dateValue - b.dateValue);
  });

  return map;
}

function sliceHistory(list: TeamFixture[], cutoff: number, limit?: number | null) {
  const prior = list.filter((entry) => entry.dateValue < cutoff);
  if (typeof limit === "number") {
    return prior.slice(Math.max(0, prior.length - limit));
  }
  return prior;
}

function makeBuckets() {
  return Array.from({ length: TOTAL_BADGES }, (_, idx) => ({
    badgeCount: idx + 1,
    total: 0,
    success: 0,
  }));
}

export default function ConfidenceView({
  fixtures,
  teamId,
  leagueId,
  range,
}: {
  fixtures: FixtureInput[];
  teamId?: number | null;
  leagueId?: number | null;
  range?: RangeOption;
}) {
  const [seasonFilter, setSeasonFilter] = useState<SeasonFilter>("all");
  const [allFixtures, setAllFixtures] = useState<FixtureInput[]>([]);
  const [loading, setLoading] = useState(false);

  const seasons = useMemo(
    () =>
      seasonFilter === "all"
        ? [...SEASON_OPTIONS]
        : [Number(seasonFilter)],
    [seasonFilter]
  );

  const teamIds = useMemo(() => {
    const ids = new Set<number>();
    const seasonSet = new Set(seasons);
    for (const fixture of fixtures ?? []) {
      const season = parseSeason(fixture.season);
      if (season == null || !seasonSet.has(season)) continue;
      if (leagueId != null) {
        if (fixture.competition_id == null) continue;
        if (Number(fixture.competition_id) !== Number(leagueId)) continue;
      }
      if (fixture.home_team_id != null) {
        const homeId = Number(fixture.home_team_id);
        if (Number.isFinite(homeId)) ids.add(homeId);
      }
      if (fixture.away_team_id != null) {
        const awayId = Number(fixture.away_team_id);
        if (Number.isFinite(awayId)) ids.add(awayId);
      }
    }
    return Array.from(ids);
  }, [fixtures, seasons, leagueId]);

  useEffect(() => {
    let active = true;
    async function loadFixtures() {
      if (!teamIds.length) {
        setAllFixtures([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const data = await getFixturesForTeamsSeasons(teamIds, seasons, leagueId);
      if (!active) return;
      setAllFixtures(data ?? []);
      setLoading(false);
    }
    loadFixtures();
    return () => {
      active = false;
    };
  }, [teamIds, seasons, leagueId]);

  const analysis = useMemo(() => {
    const buckets = makeBuckets();
    const summary = {
      totalMatches: 0,
      usedMatches: 0,
      buckets,
    };

    if (!Number.isFinite(teamId)) return summary;
    if (!allFixtures.length) return summary;

    const fixturesByTeam = buildTeamFixtureMap(allFixtures, seasons, leagueId);
    const teamList = fixturesByTeam.get(Number(teamId)) ?? [];
    if (!teamList.length) return summary;

    const limit = typeof range === "number" ? range : null;
    summary.totalMatches = teamList.length;

    for (const match of teamList) {
      const opponentId = match.opponentId;
      const opponentList = fixturesByTeam.get(opponentId) ?? [];
      const teamHistory = sliceHistory(teamList, match.dateValue, limit);
      const oppHistory = sliceHistory(opponentList, match.dateValue, limit);

      const teamScoredValues = teamHistory.map(getGoalsScored);
      const teamTotalValues = teamHistory.map(getGoalsTotal);
      const oppTotalValues = oppHistory.map(getGoalsTotal);

      const lastScored = teamScoredValues.length
        ? teamScoredValues[teamScoredValues.length - 1]
        : null;
      const lastTotalTeam = teamTotalValues.length
        ? teamTotalValues[teamTotalValues.length - 1]
        : null;
      const lastTotalOpp = oppTotalValues.length
        ? oppTotalValues[oppTotalValues.length - 1]
        : null;

      const scoredNext = computeNextMatchBelow(teamScoredValues, SCORED_THRESHOLD);
      const totalNext = computeNextMatchBelow(teamTotalValues, TOTAL_THRESHOLD);

      const teamUnderPercent = percentUnder(teamTotalValues, TOTAL_THRESHOLD);
      const oppUnderPercent = percentUnder(oppTotalValues, TOTAL_THRESHOLD);

      const homeHistory = teamHistory.filter((entry) => entry.isHome);
      const awayHistory = teamHistory.filter((entry) => !entry.isHome);
      const oppHomeHistory = oppHistory.filter((entry) => entry.isHome);
      const oppAwayHistory = oppHistory.filter((entry) => !entry.isHome);

      const homePercent = match.isHome
        ? percentUnder(homeHistory.map(getGoalsTotal), TOTAL_THRESHOLD)
        : percentUnder(oppHomeHistory.map(getGoalsTotal), TOTAL_THRESHOLD);
      const awayPercent = match.isHome
        ? percentUnder(oppAwayHistory.map(getGoalsTotal), TOTAL_THRESHOLD)
        : percentUnder(awayHistory.map(getGoalsTotal), TOTAL_THRESHOLD);

      const badges = [
        lastScored != null && lastScored > 2.5,
        scoredNext.lastAbove && scoredNext.triggers > 0 && scoredNext.percent >= 70,
        totalNext.lastAbove && totalNext.triggers > 0 && totalNext.percent >= 70,
        lastTotalTeam != null && lastTotalTeam > TOTAL_THRESHOLD,
        lastTotalOpp != null && lastTotalOpp > TOTAL_THRESHOLD,
        isBetween70And99(teamUnderPercent) && isBetween70And99(oppUnderPercent),
        isBetween70And99(homePercent) && isBetween70And99(awayPercent),
      ];

      const badgeCount = badges.filter(Boolean).length;
      if (badgeCount < 1 || badgeCount > TOTAL_BADGES) continue;

      const matchTotal = getGoalsTotal(match);
      const underResult = matchTotal <= TOTAL_THRESHOLD;

      const bucket = buckets.find((item) => item.badgeCount === badgeCount);
      if (!bucket) continue;
      bucket.total += 1;
      if (underResult) bucket.success += 1;
      summary.usedMatches += 1;
    }

    return summary;
  }, [allFixtures, teamId, seasons, leagueId, range]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSeasonFilter("all")}
          className={`px-3 py-1 text-sm rounded-lg transition ${
            seasonFilter === "all"
              ? "bg-green-600 text-white"
              : "bg-white/10 text-white/60 hover:bg-white/15"
          }`}
        >
          Saisons 2024 + 2025
        </button>
        <button
          type="button"
          onClick={() => setSeasonFilter("2024")}
          className={`px-3 py-1 text-sm rounded-lg transition ${
            seasonFilter === "2024"
              ? "bg-green-600 text-white"
              : "bg-white/10 text-white/60 hover:bg-white/15"
          }`}
        >
          Saison 2024
        </button>
        <button
          type="button"
          onClick={() => setSeasonFilter("2025")}
          className={`px-3 py-1 text-sm rounded-lg transition ${
            seasonFilter === "2025"
              ? "bg-green-600 text-white"
              : "bg-white/10 text-white/60 hover:bg-white/15"
          }`}
        >
          Saison 2025
        </button>
      </div>

      <div className="p-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl text-white">
        <div className="font-semibold">Calibration badges (under 3.5)</div>
        <div className="text-xs text-white/70 mt-1">
          Mode FT | Filtre historique: {rangeLabel(range)} | Badges actifs sur{" "}
          {TOTAL_BADGES}
        </div>
        <div className="text-xs text-white/70 mt-1">
          Matchs utilises: {analysis.usedMatches} / {analysis.totalMatches}
        </div>
      </div>

      {loading ? (
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-white/80">
          Chargement des fixtures...
        </div>
      ) : analysis.totalMatches === 0 ? (
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-white/80">
          Aucune donnee disponible pour ce filtre.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {analysis.buckets.map((bucket) => {
            const percent = bucket.total
              ? Math.round((bucket.success / bucket.total) * 100)
              : null;
            return (
              <div
                key={`badge-${bucket.badgeCount}`}
                className="p-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl text-white"
              >
                <div className="text-sm text-white/70">
                  Badge {bucket.badgeCount}/{TOTAL_BADGES}
                </div>
                <div className="text-3xl font-semibold mt-2">
                  {percent == null ? "--" : `${percent}%`}
                </div>
                <div className="text-xs text-white/70 mt-2">
                  Under 3.5: {bucket.total ? `${bucket.success}/${bucket.total}` : "--"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
