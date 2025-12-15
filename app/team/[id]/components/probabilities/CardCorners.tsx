import StatRow from "./StatRow";

export default function CardCorners({ data }) {
  const statsEngine = data;
  const streaks = data?.streaks ?? {};
  console.log("📘 CARD streaks:", streaks);
  if (!statsEngine) return null;
  const total = statsEngine.total ?? 0;
  const over = statsEngine.corners?.over ?? { raw: 0, percent: 0 };
  const under = statsEngine.corners?.under ?? { raw: 0, percent: 0 };

  return (
    <div className="bg-white/5 rounded-xl p-6 shadow">
      <h3 className="font-semibold mb-3">Corners</h3>
      <div className="space-y-1">
        <StatRow label="Corners Over" count={`(${over.raw}/${total})`} percentGreen={`${over.percent}%`} percentBlue={streaks?.corners_over?.active ? `${streaks.corners_over.percent}%` : "–"} />
        <StatRow label="Corners Under" count={`(${under.raw}/${total})`} percentGreen={`${under.percent}%`} percentBlue={streaks?.corners_under?.active ? `${streaks.corners_under.percent}%` : "–"} />
      </div>
    </div>
  );
}
