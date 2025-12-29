import { supabase } from "../supabase/client";

export async function getTeamFixturesAllSeasons(teamId: number) {
  const { data, error } = await supabase
    .from("fixtures")
    .select(`
      id,
      date_utc,
      season,
      home_team_id,
      away_team_id,
      goals_home,
      goals_away,
      goals_home_ht,
      goals_away_ht,
      teams:home_team_id ( id, name, logo ),
      opp:away_team_id ( id, name, logo )
    `)
    .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`);

  if (error) {
    console.error("Supabase fixtures error:", error);
    return [];
  }

  return data;
}
