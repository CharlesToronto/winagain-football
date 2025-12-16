import { createClient } from "@/lib/supabase/server";

export type HomeCounts = {
  fixturesToday: number;
  leagues: number;
  teams: number;
  teamStats: number;
  odds: number;
};

export async function loadHomeCounts(): Promise<HomeCounts> {
  try {
    const supabase = createClient();

    const { count: fixturesToday } = await supabase
      .from("fixtures")
      .select("*", { count: "exact", head: true })
      .gte("date", new Date().toISOString().slice(0, 10))
      .lte("date", new Date().toISOString().slice(0, 10));

    const { count: leagues } = await supabase
      .from("competitions")
      .select("*", { count: "exact", head: true });

    const { count: teams } = await supabase
      .from("teams")
      .select("*", { count: "exact", head: true });

    const { count: teamStats } = await supabase
      .from("team_stats")
      .select("*", { count: "exact", head: true });

    const { count: odds } = await supabase
      .from("odds")
      .select("*", { count: "exact", head: true });

    return {
      fixturesToday: fixturesToday || 0,
      leagues: leagues || 0,
      teams: teams || 0,
      teamStats: teamStats || 0,
      odds: odds || 0,
    };
  } catch (e) {
    console.error("Home counts error:", e);
    return {
      fixturesToday: 0,
      leagues: 0,
      teams: 0,
      teamStats: 0,
      odds: 0,
    };
  }
}
