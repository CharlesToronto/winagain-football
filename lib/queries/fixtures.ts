import { supabase } from "../supabase/client";

export async function getTeamFixturesAllSeasons(teamId: number) {
  const { data, error } = await supabase
    .from("fixtures")
    .select(`
      id,
      date_utc,
      season,
      competition_id,
      round,
      status_short,
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

export async function getLeagueFixturesAllSeasons(leagueId: number) {
  const { data, error } = await supabase
    .from("fixtures")
    .select(`
      id,
      date_utc,
      season,
      competition_id,
      home_team_id,
      away_team_id,
      goals_home,
      goals_away,
      goals_home_ht,
      goals_away_ht
    `)
    .eq("competition_id", leagueId);

  if (error) {
    console.error("Supabase league fixtures error:", error);
    return [];
  }

  return data;
}

export async function getLeagueFixturesBySeason(
  leagueId: number,
  season: number | string
) {
  const { data, error } = await supabase
    .from("fixtures")
    .select(`
      id,
      date_utc,
      season,
      competition_id,
      round,
      round_text:round,
      status_short,
      home_team_id,
      away_team_id,
      goals_home,
      goals_away,
      goals_home_ht,
      goals_away_ht,
      teams:home_team_id ( id, name, logo ),
      opp:away_team_id ( id, name, logo )
    `)
    .eq("competition_id", leagueId)
    .eq("status_short", "FT")
    .eq("season", season);

  if (error) {
    console.error("Supabase league fixtures error:", error);
    return [];
  }

  const seasonKey = String(season);
  return (data ?? []).filter((fixture) => String(fixture.season) === seasonKey);
}
