import StatRow from "./StatRow";

export default function CardOverUnder({ data, streaks }: { data: any; streaks: any }) {
  const statsEngine = data;
  const resolvedStreaks = data?.streaks ?? streaks ?? {};
  console.log("📘 CARD streaks:", resolvedStreaks);
  if (!statsEngine) return null;
  const over = statsEngine.over ?? {};
  const under = statsEngine.under ?? {};
  const total = statsEngine.total ?? 0;
  const val = (obj: any) => ({
    raw: obj?.raw ?? obj?.count ?? 0,
    percent: obj?.percent ?? 0,
  });

  return (
    <div className="bg-white/5 rounded-xl p-6 shadow">
      <h3 className="font-semibold mb-3">Over / Under</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <StatRow label="Over 0.5" count={`(${val(over["0.5"]).raw}/${total})`} percentGreen={`${val(over["0.5"]).percent}%`} percentBlue={resolvedStreaks?.over?.["0.5"]?.active ? `${resolvedStreaks.over["0.5"].percent}%` : "–"} />
          <StatRow label="Over 1.5" count={`(${val(over["1.5"]).raw}/${total})`} percentGreen={`${val(over["1.5"]).percent}%`} percentBlue={resolvedStreaks?.over?.["1.5"]?.active ? `${resolvedStreaks.over["1.5"].percent}%` : "–"} />
          <StatRow label="Over 2.5" count={`(${val(over["2.5"]).raw}/${total})`} percentGreen={`${val(over["2.5"]).percent}%`} percentBlue={resolvedStreaks?.over?.["2.5"]?.active ? `${resolvedStreaks.over["2.5"].percent}%` : "–"} />
          <StatRow label="Over 3.5" count={`(${val(over["3.5"]).raw}/${total})`} percentGreen={`${val(over["3.5"]).percent}%`} percentBlue={resolvedStreaks?.over?.["3.5"]?.active ? `${resolvedStreaks.over["3.5"].percent}%` : "–"} />
          <StatRow label="Over 4.5" count={`(${val(over["4.5"]).raw}/${total})`} percentGreen={`${val(over["4.5"]).percent}%`} percentBlue={resolvedStreaks?.over?.["4.5"]?.active ? `${resolvedStreaks.over["4.5"].percent}%` : "–"} />
          <StatRow label="Over 5.5" count={`(${val(over["5.5"]).raw}/${total})`} percentGreen={`${val(over["5.5"]).percent}%`} percentBlue={resolvedStreaks?.over?.["5.5"]?.active ? `${resolvedStreaks.over["5.5"].percent}%` : "–"} />
        </div>
        <div className="space-y-1">
          <StatRow label="Under 0.5" count={`(${val(under["0.5"]).raw}/${total})`} percentGreen={`${val(under["0.5"]).percent}%`} percentBlue={resolvedStreaks?.under?.["0.5"]?.active ? `${resolvedStreaks.under["0.5"].percent}%` : "–"} />
          <StatRow label="Under 1.5" count={`(${val(under["1.5"]).raw}/${total})`} percentGreen={`${val(under["1.5"]).percent}%`} percentBlue={resolvedStreaks?.under?.["1.5"]?.active ? `${resolvedStreaks.under["1.5"].percent}%` : "–"} />
          <StatRow label="Under 2.5" count={`(${val(under["2.5"]).raw}/${total})`} percentGreen={`${val(under["2.5"]).percent}%`} percentBlue={resolvedStreaks?.under?.["2.5"]?.active ? `${resolvedStreaks.under["2.5"].percent}%` : "–"} />
          <StatRow label="Under 3.5" count={`(${val(under["3.5"]).raw}/${total})`} percentGreen={`${val(under["3.5"]).percent}%`} percentBlue={resolvedStreaks?.under?.["3.5"]?.active ? `${resolvedStreaks.under["3.5"].percent}%` : "–"} />
          <StatRow label="Under 4.5" count={`(${val(under["4.5"]).raw}/${total})`} percentGreen={`${val(under["4.5"]).percent}%`} percentBlue={resolvedStreaks?.under?.["4.5"]?.active ? `${resolvedStreaks.under["4.5"].percent}%` : "–"} />
          <StatRow label="Under 5.5" count={`(${val(under["5.5"]).raw}/${total})`} percentGreen={`${val(under["5.5"]).percent}%`} percentBlue={resolvedStreaks?.under?.["5.5"]?.active ? `${resolvedStreaks.under["5.5"].percent}%` : "–"} />
        </div>
      </div>
    </div>
  );
}
