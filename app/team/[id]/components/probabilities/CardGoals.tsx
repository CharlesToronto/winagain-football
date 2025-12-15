import StatRow from "./StatRow";

export default function CardGoals({ data, streaks }: { data: any; streaks: any }) {
  const statsEngine = data;
  const resolvedStreaks = data?.streaks ?? streaks ?? {};
  console.log("📘 CARD streaks:", resolvedStreaks);
  if (!statsEngine) return null;
  const total = statsEngine.total ?? 0;
  const safe = (obj: any) => ({
    raw: obj?.raw ?? obj?.count ?? 0,
    percent: obj?.percent ?? 0,
  });
  const btts = safe(statsEngine.btts);
  const cleanHome = safe(statsEngine.clean_home);
  const cleanAway = safe(statsEngine.clean_away);
  return (
    <div className="bg-white/5 rounded-xl p-6 shadow">
      <h3 className="font-semibold mb-3">Buts & scoring</h3>
      <div className="space-y-1">
        <StatRow label="BTTS" count={`(${btts.raw}/${total})`} percentGreen={`${btts.percent}%`} percentBlue={resolvedStreaks?.btts?.active ? `${resolvedStreaks.btts.percent}%` : "–"} />
        <StatRow label="Clean Sheet Home" count={`(${cleanHome.raw}/${total})`} percentGreen={`${cleanHome.percent}%`} percentBlue={resolvedStreaks?.clean_home?.active ? `${resolvedStreaks.clean_home.percent}%` : "–"} />
        <StatRow label="Clean Sheet Away" count={`(${cleanAway.raw}/${total})`} percentGreen={`${cleanAway.percent}%`} percentBlue={resolvedStreaks?.clean_away?.active ? `${resolvedStreaks.clean_away.percent}%` : "–"} />
      </div>
    </div>
  );
}
