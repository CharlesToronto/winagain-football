import StatRow from "./StatRow";

export default function CardSeries({ data, streaks }: { data: any; streaks: any }) {
  const statsEngine = data;
  const resolvedStreaks = data?.streaks ?? streaks ?? {};
  console.log("📘 CARD streaks:", resolvedStreaks);
  if (!statsEngine) return null;
  const total = statsEngine.total ?? 0;
  const safe = (obj: any) => ({ raw: obj?.raw ?? obj?.count ?? 0, percent: obj?.percent ?? 0 });

  const win = safe(statsEngine.series?.win_streak);
  const lose = safe(statsEngine.series?.lose_streak);
  const draw = safe(statsEngine.series?.draw_streak);
  const btts = safe(statsEngine.series?.btts_streak);
  const over25 = safe(statsEngine.series?.over25);
  const under25 = safe(statsEngine.series?.under25);
  const cleanHome = safe(statsEngine.series?.cleansheet_home);
  const cleanAway = safe(statsEngine.series?.cleansheet_away);

  return (
    <div className="bg-white/5 rounded-xl p-6 shadow">
      <h3 className="font-semibold mb-3">Séries & tendances</h3>
      <div className="space-y-1">
        <StatRow label="Série de victoires" count={`(${win.raw}/${total})`} percentGreen={`${win.percent}%`} percentBlue={resolvedStreaks?.win?.active ? `${resolvedStreaks.win.percent}%` : "–"} />
        <StatRow label="Série de défaites" count={`(${lose.raw}/${total})`} percentGreen={`${lose.percent}%`} percentBlue={resolvedStreaks?.lose?.active ? `${resolvedStreaks.lose.percent}%` : "–"} />
        <StatRow label="Série de nuls" count={`(${draw.raw}/${total})`} percentGreen={`${draw.percent}%`} percentBlue={resolvedStreaks?.draw?.active ? `${resolvedStreaks.draw.percent}%` : "–"} />
        <StatRow label="Série BTTS" count={`(${btts.raw}/${total})`} percentGreen={`${btts.percent}%`} percentBlue={resolvedStreaks?.btts?.active ? `${resolvedStreaks.btts.percent}%` : "–"} />
        <StatRow label="Série Over 2.5" count={`(${over25.raw}/${total})`} percentGreen={`${over25.percent}%`} percentBlue={resolvedStreaks?.over?.["2.5"]?.active ? `${resolvedStreaks.over["2.5"].percent}%` : "–"} />
        <StatRow label="Série Under 2.5" count={`(${under25.raw}/${total})`} percentGreen={`${under25.percent}%`} percentBlue={resolvedStreaks?.under?.["2.5"]?.active ? `${resolvedStreaks.under["2.5"].percent}%` : "–"} />
        <StatRow label="Série clean sheet home" count={`(${cleanHome.raw}/${total})`} percentGreen={`${cleanHome.percent}%`} percentBlue={resolvedStreaks?.clean_home?.active ? `${resolvedStreaks.clean_home.percent}%` : "–"} />
        <StatRow label="Série clean sheet away" count={`(${cleanAway.raw}/${total})`} percentGreen={`${cleanAway.percent}%`} percentBlue={resolvedStreaks?.clean_away?.active ? `${resolvedStreaks.clean_away.percent}%` : "–"} />
      </div>
    </div>
  );
}
