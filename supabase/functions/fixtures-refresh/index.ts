export const config = {
  jwtVerify: false,
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// ENV VARIABLES
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const API_FOOTBALL_KEY = Deno.env.get("API_FOOTBALL_KEY")!

// Fetch wrapper for API Football
async function fetchApiFootball(path: string, params: Record<string, any>) {
  const url = new URL(`https://v3.football.api-sports.io/${path}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, `${v}`))

  const res = await fetch(url, {
    headers: {
      "x-apisports-key": API_FOOTBALL_KEY,
    },
  })

  return res.json()
}

serve(async () => {
  const supabase = getSupabaseAdmin()

  const SEASON = 2025

  // Import competitions list from Supabase DB
  const { data: competitions, error: competitionsError } = await supabase
    .from("competitions")
    .select("id")

  if (competitionsError) {
    return new Response(JSON.stringify({ error: competitionsError.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    })
  }

  let checked = 0
  let updated = 0
  let errors: any[] = []

  for (const comp of competitions ?? []) {
    try {
      const apiResponse = await fetchApiFootball("fixtures", {
        league: comp.id,
        season: SEASON,
        status: "FT",
      })

      const matches = apiResponse?.response ?? []
      checked += matches.length

      for (const fx of matches) {
        const id = fx.fixture?.id
        if (!id) continue

        const { data: existing } = await supabase
          .from("fixtures")
          .select("*")
          .eq("id", id)
          .single()

        if (!existing) continue

        const newStatusShort = fx.fixture?.status?.short ?? null
        const newStatusLong = fx.fixture?.status?.long ?? null
        const newGoalsHome = fx.goals?.home ?? null
        const newGoalsAway = fx.goals?.away ?? null
        const newRound = fx.league?.round ?? null
        const newDateUtc = fx.fixture?.date ?? null

        const changed =
          existing.status_short !== newStatusShort ||
          existing.status_long !== newStatusLong ||
          existing.goals_home !== newGoalsHome ||
          existing.goals_away !== newGoalsAway ||
          existing.round !== newRound ||
          existing.date_utc !== newDateUtc

        if (!changed) continue

        const { error: updateError } = await supabase
          .from("fixtures")
          .update({
            status_short: newStatusShort,
            status_long: newStatusLong,
            goals_home: newGoalsHome,
            goals_away: newGoalsAway,
            round: newRound,
            date_utc: newDateUtc,
          })
          .eq("id", id)

        if (updateError) {
          errors.push({ id, leagueId: comp.id, error: updateError.message })
        } else {
          updated++
        }
      }
    } catch (err: any) {
      errors.push({ leagueId: comp.id, error: err?.message })
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      mode: "SUPABASE_FIXTURES_REFRESH",
      season: SEASON,
      checked,
      updated,
      errorCount: errors.length,
      errors,
    }),
    { headers: { "Content-Type": "application/json" } }
  )
})

// Create supabase service client
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
function getSupabaseAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
}
