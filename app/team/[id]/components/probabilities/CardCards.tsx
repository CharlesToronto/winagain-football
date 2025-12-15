import StatRow from "./StatRow";

export default function CardCards({ data, streaks }: { data: any; streaks: any }) {
  const statsEngine = data;
  const resolvedStreaks = data?.streaks ?? streaks ?? {};
  console.log("📘 CARD streaks:", resolvedStreaks);
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
          percentBlue={resolvedStreaks?.cards_over?.active ? `${resolvedStreaks.cards_over.percent}%` : "–"}
        />
        <StatRow
          label="Total Cards Under"
          count={`(${under.raw}/${total})`}
          percentGreen={`${under.percent}%`}
          percentBlue={resolvedStreaks?.cards_under?.active ? `${resolvedStreaks.cards_under.percent}%` : "–"}
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
