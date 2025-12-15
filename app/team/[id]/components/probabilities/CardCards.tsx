import StatRow from "./StatRow";

export default function CardCards({ data }: { data: any }) {
  const statsEngine = data;
  const streaks = data?.streaks ?? {};
  console.log("📘 CARD streaks:", streaks);
  if (!statsEngine) return null;
  const total = statsEngine.total ?? 0;
  const over = statsEngine.cards?.total_over ?? { raw: 0, percent: 0 };
  const under = statsEngine.cards?.total_under ?? { raw: 0, percent: 0 };
  const avg = statsEngine.cards?.avg ?? 0;
  return (
    <div className="bg-white/5 rounded-xl p-6 shadow">
      <h3 className="font-semibold mb-3">Cartons</h3>
      <div className="space-y-1">
        <StatRow
          label="Total Cards Over"
          count={`(${over.raw}/${total})`}
          percentGreen={`${over.percent}%`}
          percentBlue={streaks?.cards_over?.active ? `${streaks.cards_over.percent}%` : "–"}
        />
        <StatRow
          label="Total Cards Under"
          count={`(${under.raw}/${total})`}
          percentGreen={`${under.percent}%`}
          percentBlue={streaks?.cards_under?.active ? `${streaks.cards_under.percent}%` : "–"}
        />
        <StatRow
          label="Average cards per game"
          count={`${avg}`}
          percentGreen="-"
          percentBlue="–"
        />
      </div>
    </div>
  );
}
