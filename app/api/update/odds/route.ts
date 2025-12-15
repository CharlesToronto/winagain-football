import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchApi } from "@/lib/football";
import { COMPETITION_IDS_BY_COUNTRY, ALL_COMPETITION_IDS } from "@/app/lib/data/competitionIds";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient();

  try {
    const { data: fixtures, error } = await supabase
      .from("fixtures")
      .select("id, date_utc, competition_id, season");

    if (error) {
      return NextResponse.json({ error: "DB fixtures error", details: error }, { status: 500 });
    }

    let inserted = 0;
    let updated = 0;

    for (const fx of fixtures) {
      if (fx.season !== 2025) continue;
      if (!ALL_COMPETITION_IDS.includes(fx.competition_id)) continue;

      // Fetch all odds (API returns historical timestamps)
      const api = await fetchApi("odds", {
        fixture: fx.id,
      });

      const rawOdds = api.response?.[0]?.bookmakers || [];

      for (const bm of rawOdds) {
        for (const bet of bm.bets) {
          const marketId = bet.id;
          const marketName = bet.name;

          const snap = bet.values
            .sort(
              (a: any, b: any) =>
                new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            )[0];

          const updateTime = bm.update || api.response?.[0]?.update;

          if (!snap) continue;

          const { error: upsertError } = await supabase.from("fixture_odds").upsert(
            {
              fixture_id: fx.id,
              league_id: fx.competition_id,
              season: fx.season,

              market_id: marketId,
              market_name: marketName,

              bookmaker_id: bm.id,
              bookmaker_name: bm.name,

              label: snap.value,
              value: snap.odd,
              update_time: updateTime,
            },
            {
              onConflict: "fixture_id, market_id, bookmaker_id, label",
            }
          );

          if (!upsertError) inserted++;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      inserted,
      updated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: true, details: err.message });
  }
}
