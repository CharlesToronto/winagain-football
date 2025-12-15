import StatRow from "./StatRow";

export default function CardCorners({ data, streaks }: { data: any; streaks: any }) {
  const statsEngine = data;
  const resolvedStreaks = data?.streaks ?? streaks ?? {};
  console.log("📘 CARD streaks:", resolvedStreaks);
  if (!statsEngine) return null;
  const total = statsEngine.total ?? 0;
  const over = statsEngine.corners?.over ?? { raw: 0, percent: 0 };
  const under = statsEngine.corners?.under ?? { raw: 0, percent: 0 };

  return (
    <div className="bg-white/5 rounded-xl p-6 shadow">
      <h3 className="font-semibold mb-3">Corners</h3>
      <div className="space-y-1">
        <StatRow label="Corners Over" count={`(${over.raw}/${total})`} percentGreen={`${over.percent}%`} percentBlue={resolvedStreaks?.corners_over?.active ? `${resolvedStreaks.corners_over.percent}%` : "–"} />
        <StatRow label="Corners Under" count={`(${under.raw}/${total})`} percentGreen={`${under.percent}%`} percentBlue={resolvedStreaks?.corners_under?.active ? `${resolvedStreaks.corners_under.percent}%` : "–"} />
      </div>
    </div>
  );
}
