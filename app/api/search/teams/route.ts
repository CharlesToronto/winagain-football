import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import computeFT from "@/lib/analysisEngine/computeFT";
import computeStreaks from "@/lib/analysisEngine/computeStreaks";
import type { MarketType, SearchFilters } from "@/app/search/types";

type Filters = Partial<SearchFilters>;

const CURRENT_SEASON = 2025;

function pickProb(
  market: MarketType,
  stats: any,
  streaks: any
): { green: number; blue: number | null } | null {
  const line = (k: string) => k.replace("OVER_", "").replace("UNDER_", "").replace("_", "."); // "0_5" -> "0.5"
  const safe = (obj: any) => obj?.percent ?? 0;
  const safeBlue = (obj: any) => (obj?.percent == null ? null : obj.percent);

  switch (market) {
    case "OVER_0_5":
    case "OVER_1_5":
    case "OVER_2_5":
    case "OVER_3_5":
    case "OVER_4_5": {
      const key = line(market);
      return {
        green: safe(stats?.over?.[key]),
        blue: safeBlue(streaks?.over?.[key]),
      };
    }
    case "UNDER_0_5":
    case "UNDER_1_5":
    case "UNDER_2_5":
    case "UNDER_3_5":
    case "UNDER_4_5":
    case "UNDER_5_5": {
      const key = line(market);
      return {
        green: safe(stats?.under?.[key]),
        blue: safeBlue(streaks?.under?.[key]),
      };
    }
    case "DC_1X":
      return { green: safe(stats?.dc_1x), blue: safeBlue(streaks?.dc_1x) };
    case "DC_X2":
      return { green: safe(stats?.dc_x2), blue: safeBlue(streaks?.dc_x2) };
    case "DC_12":
      return { green: safe(stats?.dc_12), blue: safeBlue(streaks?.dc_12) };
    default:
      return null;
  }
}

function getOutcome(f: any, teamId: number): "W" | "D" | "L" | null {
  const homeGoals = f?.goals_home;
  const awayGoals = f?.goals_away;
  if (homeGoals == null || awayGoals == null) return null;
  if (homeGoals === awayGoals) return "D";
  const isHome = f?.home_team_id === teamId;
  const homeWin = homeGoals > awayGoals;
  if (isHome) return homeWin ? "W" : "L";
  return homeWin ? "L" : "W";
}

function matchesFact(f: any, teamId: number, filters: SearchFilters) {
  const factType = filters.factType ?? "none";
  if (factType === "none") return true;

  const homeGoals = f?.goals_home;
  const awayGoals = f?.goals_away;
  if (homeGoals == null || awayGoals == null) return false;

  if (factType === "OVER_UNDER") {
    const total = Number(homeGoals) + Number(awayGoals);
    const line = typeof filters.overUnderLine === "number" ? filters.overUnderLine : 2.5;
    const direction = filters.overUnderDirection ?? "OVER";
    return direction === "UNDER" ? total < line : total > line;
  }

  if (factType === "RESULT") {
    const outcome = getOutcome(f, teamId);
    if (!outcome) return false;
    const resultType = filters.resultType ?? "1X";
    switch (resultType) {
      case "1":
        return outcome === "W";
      case "2":
        return outcome === "L";
      case "X":
        return outcome === "D";
      case "1X":
        return outcome === "W" || outcome === "D";
      case "X2":
        return outcome === "D" || outcome === "L";
      case "12":
        return outcome !== "D";
      default:
        return true;
    }
  }

  if (factType === "CLEAN_SHEET") {
    const isHome = f?.home_team_id === teamId;
    const conceded = isHome ? awayGoals : homeGoals;
    return Number(conceded) === 0;
  }

  return true;
}

function getStreakLength(fixtures: any[], teamId: number, filters: SearchFilters) {
  let streak = 0;
  for (const f of fixtures) {
    if (!matchesFact(f, teamId, filters)) break;
    streak += 1;
  }
  return streak;
}

export async function POST(req: Request) {
  const supabase = createClient();

  let body: Filters = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const filters: SearchFilters = {
    factType:
      body.factType === "OVER_UNDER" ||
      body.factType === "RESULT" ||
      body.factType === "CLEAN_SHEET"
        ? body.factType
        : "none",
    overUnderDirection: body.overUnderDirection === "UNDER" ? "UNDER" : "OVER",
    overUnderLine:
      typeof body.overUnderLine === "number"
        ? body.overUnderLine
        : Number(body.overUnderLine) || 2.5,
    resultType:
      body.resultType === "1" ||
      body.resultType === "2" ||
      body.resultType === "X" ||
      body.resultType === "1X" ||
      body.resultType === "X2" ||
      body.resultType === "12"
        ? body.resultType
        : "1X",
    streakMin:
      typeof body.streakMin === "number"
        ? body.streakMin
        : Number(body.streakMin) || 1,
  };

  // 1) Charger toutes les fixtures FT de la saison courante (recent -> ancien)
  const { data: seasonFixtures, error: fixturesError } = await supabase
    .from("fixtures")
    .select("id,date_utc,season,home_team_id,away_team_id,goals_home,goals_away")
    .eq("season", CURRENT_SEASON)
    .eq("status_short", "FT")
    .not("goals_home", "is", null)
    .not("goals_away", "is", null)
    .order("date_utc", { ascending: false });

  if (fixturesError) {
    return NextResponse.json(
      { ok: false, error: fixturesError.message },
      { status: 500 }
    );
  }

  const fixturesByTeam = new Map<number, any[]>();
  (seasonFixtures ?? []).forEach((f: any) => {
    if (!f?.date_utc) return;
    if (f.home_team_id) {
      const list = fixturesByTeam.get(f.home_team_id) ?? [];
      list.push({ ...f, isHome: true });
      fixturesByTeam.set(f.home_team_id, list);
    }
    if (f.away_team_id) {
      const list = fixturesByTeam.get(f.away_team_id) ?? [];
      list.push({ ...f, isHome: false });
      fixturesByTeam.set(f.away_team_id, list);
    }
  });

  if (fixturesByTeam.size === 0) {
    return NextResponse.json({ ok: true, results: [] });
  }

  // 2) Charger les teams + leagues
  const teamIds = Array.from(fixturesByTeam.keys());
  const { data: teamsData } = await supabase
    .from("teams")
    .select("id,name,logo,competition_id");

  const { data: compsData } = await supabase
    .from("competitions")
    .select("id,name");

  const teamIndex = new Map<number, any>();
  (teamsData ?? []).forEach((t: any) => {
    teamIndex.set(t.id, t);
  });
  const compIndex = new Map<number, string>();
  (compsData ?? []).forEach((c: any) => {
    compIndex.set(c.id, c.name);
  });

  const results = [];

  // 3) Pour chaque equipe, prendre le dernier match + stats
  for (const teamId of teamIds) {
    const mapped = fixturesByTeam.get(teamId) ?? [];
    if (mapped.length === 0) continue;
    const lastFixture = mapped[0];

    const streakMin = Math.min(5, Math.max(1, filters.streakMin ?? 1));
    if (filters.factType && filters.factType !== "none") {
      const streak = getStreakLength(mapped, teamId, filters);
      if (streak < streakMin) continue;
    }

    const stats = computeFT(mapped);
    const streaks = computeStreaks(mapped);

    const market: MarketType = "OVER_2_5";
    const prob = pickProb(market, stats, streaks);
    if (!prob) continue;
    const green = prob.green ?? 0;
    const blue = prob.blue ?? 0;

    const opponentId = lastFixture.isHome
      ? lastFixture.away_team_id
      : lastFixture.home_team_id;
    const teamMeta = teamIndex.get(teamId);

    results.push({
      id: teamId,
      name: teamMeta?.name ?? `Team ${teamId}`,
      logo: teamMeta?.logo ?? null,
      league: compIndex.get(teamMeta?.competition_id) ?? "Inconnu",
      lastMatchDate: lastFixture.date_utc ?? "",
      opponent: (opponentId ? teamIndex.get(opponentId)?.name : null) ?? "Inconnu",
      market,
      probGreen: green,
      probBlue: blue ?? 0,
      aboveAverage: green >= 50,
    });
  }

  results.sort((a, b) => {
    const aTime = new Date(a.lastMatchDate).getTime();
    const bTime = new Date(b.lastMatchDate).getTime();
    return bTime - aTime;
  });

  return NextResponse.json({ ok: true, results });
}
