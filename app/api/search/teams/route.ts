import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import computeFT from "@/lib/analysisEngine/computeFT";
import computeStreaks from "@/lib/analysisEngine/computeStreaks";

type MarketType =
  | "OVER_0_5"
  | "OVER_1_5"
  | "OVER_2_5"
  | "OVER_3_5"
  | "OVER_4_5"
  | "UNDER_0_5"
  | "UNDER_1_5"
  | "UNDER_2_5"
  | "UNDER_3_5"
  | "UNDER_4_5"
  | "UNDER_5_5"
  | "DC_1X"
  | "DC_X2"
  | "DC_12";

type NextMatchWindow = "today" | "j1" | "j2" | "j3";

type Filters = {
  nextMatch?: NextMatchWindow;
  markets?: MarketType[];
  probGreenMin?: number;
  probGreenMax?: number;
  probBlueMin?: number;
  probBlueMax?: number;
};

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function inWindow(dateIso: string, window: NextMatchWindow) {
  const target = new Date(dateIso).getTime();
  const start = startOfDay(Date.now());
  const offset = window === "today" ? 0 : window === "j1" ? 1 : window === "j2" ? 2 : 3;
  const end = startOfDay(Date.now() + (offset + 1) * 24 * 3600 * 1000);
  return target >= start && target < end;
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
    default:
      return null;
  }
}

export async function POST(req: Request) {
  const supabase = createClient();

  let body: Filters = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const filters: Required<Filters> = {
    nextMatch: body.nextMatch || "today",
    markets: body.markets && body.markets.length ? body.markets : [],
    probGreenMin: body.probGreenMin ?? 0,
    probGreenMax: body.probGreenMax ?? 100,
    probBlueMin: body.probBlueMin ?? 0,
    probBlueMax: body.probBlueMax ?? 100,
    useBlue: body.useBlue !== false,
  };

  // 1) Récupérer les matchs à venir dans la fenêtre
  const { data: upcoming, error: upcomingError } = await supabase
    .from("fixtures")
    .select("id,date_utc,status_short,home_team_id,away_team_id");

  if (upcomingError) {
    return NextResponse.json(
      { ok: false, error: upcomingError.message },
      { status: 500 }
    );
  }

  const candidateTeams = new Map<
    number,
    { nextMatchDate: string; opponentId: number | null }
  >();

  (upcoming ?? []).forEach((f: any) => {
    if (!f?.date_utc) return;
    if (!inWindow(f.date_utc, filters.nextMatch)) return;
    if (f.home_team_id) {
      candidateTeams.set(f.home_team_id, {
        nextMatchDate: f.date_utc,
        opponentId: f.away_team_id ?? null,
      });
    }
    if (f.away_team_id) {
      candidateTeams.set(f.away_team_id, {
        nextMatchDate: f.date_utc,
        opponentId: f.home_team_id ?? null,
      });
    }
  });

  if (candidateTeams.size === 0) {
    return NextResponse.json({ ok: true, results: [] });
  }

  // 2) Charger les teams + leagues
  const teamIds = Array.from(candidateTeams.keys());
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

  // 3) Pour chaque équipe, charger ses matchs finis (FT) et calculer les probas
  for (const teamId of teamIds) {
    const { data: finished, error: finishedError } = await supabase
      .from("fixtures")
      .select(
        "id,date_utc,status_short,home_team_id,away_team_id,goals_home,goals_away"
      )
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
      .eq("status_short", "FT")
      .not("goals_home", "is", null)
      .not("goals_away", "is", null)
      .order("date_utc", { ascending: false })
      .limit(50);

    if (finishedError) continue;
    if (!finished || finished.length === 0) continue;

    const mapped = finished.map((f: any) => ({
      ...f,
      isHome: f.home_team_id === teamId,
    }));

    const stats = computeFT(mapped);
    const streaks = computeStreaks(mapped);

    // On peut retourner un résultat par marché demandé
    const marketsToCheck = filters.markets.length ? filters.markets : (["OVER_2_5"] as MarketType[]);

    for (const market of marketsToCheck) {
      const prob = pickProb(market, stats, streaks);
      if (!prob) continue;
      const green = prob.green ?? 0;
      const blue = prob.blue ?? 0;

      if (green < filters.probGreenMin || green > filters.probGreenMax) continue;
      if (filters.useBlue && (blue < filters.probBlueMin || blue > filters.probBlueMax)) {
        continue;
      }

      const meta = candidateTeams.get(teamId);
      const teamMeta = teamIndex.get(teamId);

      results.push({
        id: teamId,
        name: teamMeta?.name ?? `Team ${teamId}`,
        logo: teamMeta?.logo ?? null,
        league: compIndex.get(teamMeta?.competition_id) ?? "Inconnu",
        nextMatchDate: meta?.nextMatchDate ?? "",
        opponent:
          (meta?.opponentId ? teamIndex.get(meta.opponentId)?.name : null) ??
          "–",
        market,
        probGreen: green,
        probBlue: blue ?? 0,
        aboveAverage: green >= 50,
      });
    }
  }

  return NextResponse.json({ ok: true, results });
}
