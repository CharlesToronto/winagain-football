import StatRow from "./StatRow";

export default function CardGoals({ data }: { data: any }) {
  const statsEngine = data;
  const streaks = data?.streaks ?? {};
  console.log("📘 CARD streaks:", streaks);
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
        <StatRow label="BTTS" count={`(${btts.raw}/${total})`} percentGreen={`${btts.percent}%`} percentBlue={streaks?.btts?.active ? `${streaks.btts.percent}%` : "–"} />
        <StatRow label="Clean Sheet Home" count={`(${cleanHome.raw}/${total})`} percentGreen={`${cleanHome.percent}%`} percentBlue={streaks?.clean_home?.active ? `${streaks.clean_home.percent}%` : "–"} />
        <StatRow label="Clean Sheet Away" count={`(${cleanAway.raw}/${total})`} percentGreen={`${cleanAway.percent}%`} percentBlue={streaks?.clean_away?.active ? `${streaks.clean_away.percent}%` : "–"} />
      </div>
    </div>
  );
}
