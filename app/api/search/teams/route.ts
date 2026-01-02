import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import computeFT from "@/lib/analysisEngine/computeFT";
import computeStreaks from "@/lib/analysisEngine/computeStreaks";
import type { MarketType, SearchFilters } from "@/app/search/types";

type Filters = Partial<SearchFilters>;

const CURRENT_SEASON = 2025;
const TEAM_CHUNK_SIZE = 500;

type NextMatchBelowSummary = {
  lastValue: number | null;
  lastAbove: boolean;
  triggers: number;
  belowNext: number;
  percent: number;
};

function chunkArray<T>(items: T[], size: number) {
  if (!items.length || size <= 0) return [];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

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
    case "RESULT_1":
      return { green: safe(stats?.win), blue: safeBlue(streaks?.win) };
    case "RESULT_X":
      return { green: safe(stats?.draw), blue: safeBlue(streaks?.draw) };
    case "RESULT_2":
      return { green: safe(stats?.lose), blue: safeBlue(streaks?.lose) };
    case "CLEAN_SHEET":
      return { green: safe(stats?.clean_home), blue: safeBlue(streaks?.clean_home) };
    default:
      return null;
  }
}

function lineToMarketKey(line: number) {
  return String(line).replace(".", "_");
}

function resolveMarket(filters: SearchFilters): MarketType {
  if (filters.factType === "OVER_UNDER") {
    const direction = filters.overUnderDirection === "UNDER" ? "UNDER" : "OVER";
    const line = typeof filters.overUnderLine === "number" ? filters.overUnderLine : 2.5;
    return `${direction}_${lineToMarketKey(line)}` as MarketType;
  }

  if (filters.factType === "RESULT") {
    const resultType = filters.resultType ?? "1X";
    if (resultType === "1") return "RESULT_1";
    if (resultType === "X") return "RESULT_X";
    if (resultType === "2") return "RESULT_2";
    if (resultType === "X2") return "DC_X2";
    if (resultType === "12") return "DC_12";
    return "DC_1X";
  }

  if (filters.factType === "CLEAN_SHEET") {
    return "CLEAN_SHEET";
  }

  return "OVER_2_5";
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

function computeNextMatchBelow(
  fixtures: any[],
  threshold: number
): NextMatchBelowSummary {
  if (!fixtures || fixtures.length === 0) {
    return {
      lastValue: null,
      lastAbove: false,
      triggers: 0,
      belowNext: 0,
      percent: 0,
    };
  }

  const ordered = [...fixtures].reverse();
  const values = ordered
    .filter((f) => f?.goals_home != null && f?.goals_away != null)
    .map((f) => (f.isHome ? f.goals_home : f.goals_away));

  if (values.length === 0) {
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
  for (let i = 0; i < values.length - 1; i += 1) {
    if (values[i] > threshold) {
      triggers += 1;
      if (values[i + 1] < threshold) {
        belowNext += 1;
      }
    }
  }

  const percent = triggers ? Math.round((belowNext / triggers) * 100) : 0;
  const lastValue = values[values.length - 1] ?? null;
  const lastAbove = lastValue !== null && lastValue > threshold;

  return {
    lastValue,
    lastAbove,
    triggers,
    belowNext,
    percent,
  };
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
    nextMatchBelowEnabled: Boolean(body.nextMatchBelowEnabled),
    nextMatchBelowLine:
      typeof body.nextMatchBelowLine === "number"
        ? body.nextMatchBelowLine
        : Number(body.nextMatchBelowLine) || 1.5,
    nextMatchBelowMinPercent:
      typeof body.nextMatchBelowMinPercent === "number"
        ? body.nextMatchBelowMinPercent
        : body.nextMatchBelowMinPercent === "" || body.nextMatchBelowMinPercent == null
        ? undefined
        : Number(body.nextMatchBelowMinPercent),
  };
  if (
    typeof filters.nextMatchBelowMinPercent === "number" &&
    !Number.isFinite(filters.nextMatchBelowMinPercent)
  ) {
    filters.nextMatchBelowMinPercent = undefined;
  }

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
  const teamChunks = chunkArray(teamIds, TEAM_CHUNK_SIZE);
  const teamsData: any[] = [];
  for (const chunk of teamChunks) {
    const { data, error } = await supabase
      .from("teams")
      .select("id,name,logo,competition_id")
      .in("id", chunk);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    if (data?.length) {
      teamsData.push(...data);
    }
  }

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

    let nextMatchBelow: NextMatchBelowSummary | null = null;
    if (filters.nextMatchBelowEnabled) {
      const line =
        typeof filters.nextMatchBelowLine === "number" ? filters.nextMatchBelowLine : 1.5;
      nextMatchBelow = computeNextMatchBelow(mapped, line);
      if (!nextMatchBelow.lastAbove || nextMatchBelow.triggers === 0) continue;
      if (
        typeof filters.nextMatchBelowMinPercent === "number" &&
        nextMatchBelow.percent < filters.nextMatchBelowMinPercent
      ) {
        continue;
      }
    }

    const stats = computeFT(mapped);
    const streaks = computeStreaks(mapped);

    const market: MarketType = resolveMarket(filters);
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
      nextMatchBelow: nextMatchBelow
        ? {
            percent: nextMatchBelow.percent,
            belowNext: nextMatchBelow.belowNext,
            triggers: nextMatchBelow.triggers,
            line:
              typeof filters.nextMatchBelowLine === "number"
                ? filters.nextMatchBelowLine
                : undefined,
          }
        : undefined,
    });
  }

  results.sort((a, b) => {
    const aTime = new Date(a.lastMatchDate).getTime();
    const bTime = new Date(b.lastMatchDate).getTime();
    return bTime - aTime;
  });

  return NextResponse.json({ ok: true, results });
}
