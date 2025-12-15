import { Fixture } from "@/types/fixture";

export default function compute2H(fixtures: Fixture[] = []) {
  const total = fixtures.length || 1;

  let win = 0;
  let draw = 0;
  let lose = 0;
  let btts = 0;
  let cleanSheet = 0;

  const overs = { 0.5: 0, 1.5: 0, 2.5: 0 };
  const unders = { 0.5: 0, 1.5: 0, 2.5: 0 };

  for (const f of fixtures) {
    const gf = (f.goals_for_full ?? 0) - (f.goals_for_ht ?? 0);
    const ga = (f.goals_against_full ?? 0) - (f.goals_against_ht ?? 0);
    const totalGoals = gf + ga;

    if (gf > ga) win++;
    else if (gf < ga) lose++;
    else draw++;

    if (gf > 0 && ga > 0) btts++;
    if (ga === 0) cleanSheet++;

    for (const key of Object.keys(overs)) {
      const k = Number(key);
      if (totalGoals > k) overs[k]++;
      else unders[k]++;
    }
  }

  const pct = (n: number) => Math.round((n / total) * 100);

  return {
    total,
    win: { count: win, percent: pct(win) },
    draw: { count: draw, percent: pct(draw) },
    lose: { count: lose, percent: pct(lose) },
    btts: { count: btts, percent: pct(btts) },
    cleanSheet: { count: cleanSheet, percent: pct(cleanSheet) },
    over: Object.fromEntries(Object.entries(overs).map(([k, v]) => [k, { count: v, percent: pct(v) }])),
    under: Object.fromEntries(Object.entries(unders).map(([k, v]) => [k, { count: v, percent: pct(v) }])),
  };
}
