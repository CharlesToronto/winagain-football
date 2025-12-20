import { useMemo, useState } from "react";
import StatRow from "./StatRow";

type Fixture = any;
type Side = "home" | "away";

function computeOverUnder(fixtures: Fixture[] = [], side: Side) {
  const thresholds = ["0.5", "1.5", "2.5", "3.5", "4.5", "5.5"];
  const totals = fixtures
    .filter((f) => {
      if (f.goals_home == null || f.goals_away == null) return false;
      if (side === "home") return f.isHome === true;
      return f.isHome === false;
    })
    .map((f) => {
      const gf = side === "home" ? f.goals_home : f.goals_away;
      const ga = side === "home" ? f.goals_away : f.goals_home;
      return (gf ?? 0) + (ga ?? 0);
    });
  const total = totals.length;
  const over: Record<string, { raw: number; percent: number }> = {};
  const under: Record<string, { raw: number; percent: number }> = {};
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
  thresholds.forEach((t) => {
    const threshold = Number(t);
    const overCount = totals.filter((x) => x > threshold).length;
    const underCount = totals.filter((x) => x <= threshold).length;
    over[t] = { raw: overCount, percent: pct(overCount) };
    under[t] = { raw: underCount, percent: pct(underCount) };
  });
  return { total, over, under };
}

export default function CardOverUnderHomeAway({ fixtures }: { fixtures: Fixture[] }) {
  const [side, setSide] = useState<Side>("home");
  const stats = useMemo(() => computeOverUnder(fixtures, side), [fixtures, side]);
  const total = stats.total;
  const over = stats.over;
  const under = stats.under;
  const val = (obj: any) => ({
    raw: obj?.raw ?? 0,
    percent: obj?.percent ?? 0,
  });

  return (
    <div className="bg-white/5 rounded-xl p-6 shadow group relative overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Over / Under ({side === "home" ? "Home" : "Away"})</h3>
        <div className="flex gap-2">
          {(["home", "away"] as Side[]).map((s) => (
            <button
              key={s}
              onClick={() => setSide(s)}
              className={`px-3 py-1 text-xs rounded-md ${
                side === s ? "bg-green-600 text-white" : "bg-white/10 text-white"
              }`}
            >
              {s === "home" ? "Home" : "Away"}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 filter blur-sm group-hover:blur-0 transition">
        <div className="space-y-1">
          <StatRow label="Over 0.5" count={`(${val(over["0.5"]).raw}/${total})`} percentGreen={`${val(over["0.5"]).percent}%`} percentBlue="–" />
          <StatRow label="Over 1.5" count={`(${val(over["1.5"]).raw}/${total})`} percentGreen={`${val(over["1.5"]).percent}%`} percentBlue="–" />
          <StatRow label="Over 2.5" count={`(${val(over["2.5"]).raw}/${total})`} percentGreen={`${val(over["2.5"]).percent}%`} percentBlue="–" />
          <StatRow label="Over 3.5" count={`(${val(over["3.5"]).raw}/${total})`} percentGreen={`${val(over["3.5"]).percent}%`} percentBlue="–" />
          <StatRow label="Over 4.5" count={`(${val(over["4.5"]).raw}/${total})`} percentGreen={`${val(over["4.5"]).percent}%`} percentBlue="–" />
          <StatRow label="Over 5.5" count={`(${val(over["5.5"]).raw}/${total})`} percentGreen={`${val(over["5.5"]).percent}%`} percentBlue="–" />
        </div>
        <div className="space-y-1">
          <StatRow label="Under 0.5" count={`(${val(under["0.5"]).raw}/${total})`} percentGreen={`${val(under["0.5"]).percent}%`} percentBlue="–" />
          <StatRow label="Under 1.5" count={`(${val(under["1.5"]).raw}/${total})`} percentGreen={`${val(under["1.5"]).percent}%`} percentBlue="–" />
          <StatRow label="Under 2.5" count={`(${val(under["2.5"]).raw}/${total})`} percentGreen={`${val(under["2.5"]).percent}%`} percentBlue="–" />
          <StatRow label="Under 3.5" count={`(${val(under["3.5"]).raw}/${total})`} percentGreen={`${val(under["3.5"]).percent}%`} percentBlue="–" />
          <StatRow label="Under 4.5" count={`(${val(under["4.5"]).raw}/${total})`} percentGreen={`${val(under["4.5"]).percent}%`} percentBlue="–" />
          <StatRow label="Under 5.5" count={`(${val(under["5.5"]).raw}/${total})`} percentGreen={`${val(under["5.5"]).percent}%`} percentBlue="–" />
        </div>
      </div>
    </div>
  );
}
