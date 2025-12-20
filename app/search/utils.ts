import { MarketType, NextMatchWindow, SearchFilters, TeamResult } from "./types";

// Mock data: dans la vraie vie, on brancherait sur Supabase/fixtures existants.
// Ici on garde l’UI fonctionnelle sans toucher au backend existant.
export const mockTeams: TeamResult[] = [
  {
    id: 49,
    name: "Chelsea",
    league: "Premier League",
    logo: "https://media.api-sports.io/football/teams/49.png",
    nextMatchDate: new Date().toISOString(),
    opponent: "Newcastle",
    market: "OVER_2_5",
    probGreen: 72,
    probBlue: 65,
    aboveAverage: true,
  },
  {
    id: 50,
    name: "Newcastle",
    league: "Premier League",
    logo: "https://media.api-sports.io/football/teams/34.png",
    nextMatchDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    opponent: "Chelsea",
    market: "DC_1X",
    probGreen: 68,
    probBlue: 60,
    aboveAverage: false,
  },
  {
    id: 85,
    name: "PSG",
    league: "Ligue 1",
    logo: "https://media.api-sports.io/football/teams/85.png",
    nextMatchDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
    opponent: "OM",
    market: "OVER_1_5",
    probGreen: 90,
    probBlue: 75,
    aboveAverage: true,
  },
  {
    id: 166,
    name: "Marseille",
    league: "Ligue 1",
    logo: "https://media.api-sports.io/football/teams/166.png",
    nextMatchDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
    opponent: "PSG",
    market: "OVER_3_5",
    probGreen: 55,
    probBlue: 52,
    aboveAverage: false,
  },
  {
    id: 101,
    name: "Dortmund",
    league: "Bundesliga",
    logo: "https://media.api-sports.io/football/teams/165.png",
    nextMatchDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    opponent: "Leipzig",
    market: "UNDER_2_5",
    probGreen: 62,
    probBlue: 58,
    aboveAverage: true,
  },
  {
    id: 102,
    name: "Leipzig",
    league: "Bundesliga",
    logo: "https://media.api-sports.io/football/teams/173.png",
    nextMatchDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
    opponent: "Dortmund",
    market: "UNDER_3_5",
    probGreen: 48,
    probBlue: 44,
    aboveAverage: false,
  },
];

export function matchInWindow(dateIso: string, window: NextMatchWindow) {
  const target = new Date(dateIso).getTime();
  const start = startOfDay(Date.now());
  const offsetDays =
    window === "today" ? 0 : window === "j1" ? 1 : window === "j2" ? 2 : 3;
  const end = startOfDay(Date.now() + offsetDays * 24 * 3600 * 1000 + 24 * 3600 * 1000);
  return target >= start && target < end;
}

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function filterTeams(data: TeamResult[], filters: SearchFilters): TeamResult[] {
  return data.filter((team) => {
    if (!matchInWindow(team.nextMatchDate, filters.nextMatch)) return false;
    if (filters.markets.length > 0 && !filters.markets.includes(team.market)) return false;
    if (team.probGreen < filters.probGreenMin || team.probGreen > filters.probGreenMax) return false;
    if (team.probBlue < filters.probBlueMin || team.probBlue > filters.probBlueMax) return false;
    return true;
  });
}
