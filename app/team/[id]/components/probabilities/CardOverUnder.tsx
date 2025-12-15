import StatRow from "./statrow";

export default function CardOverUnder({ data }) {
  const statsEngine = data;
  const streaks = data?.streaks ?? {};
  console.log("📘 CARD streaks:", streaks);
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
          <StatRow label="Over 0.5" count={`(${val(over["0.5"]).raw}/${total})`} percentGreen={`${val(over["0.5"]).percent}%`} percentBlue={streaks?.over?.["0.5"]?.active ? `${streaks.over["0.5"].percent}%` : "–"} />
          <StatRow label="Over 1.5" count={`(${val(over["1.5"]).raw}/${total})`} percentGreen={`${val(over["1.5"]).percent}%`} percentBlue={streaks?.over?.["1.5"]?.active ? `${streaks.over["1.5"].percent}%` : "–"} />
          <StatRow label="Over 2.5" count={`(${val(over["2.5"]).raw}/${total})`} percentGreen={`${val(over["2.5"]).percent}%`} percentBlue={streaks?.over?.["2.5"]?.active ? `${streaks.over["2.5"].percent}%` : "–"} />
          <StatRow label="Over 3.5" count={`(${val(over["3.5"]).raw}/${total})`} percentGreen={`${val(over["3.5"]).percent}%`} percentBlue={streaks?.over?.["3.5"]?.active ? `${streaks.over["3.5"].percent}%` : "–"} />
          <StatRow label="Over 4.5" count={`(${val(over["4.5"]).raw}/${total})`} percentGreen={`${val(over["4.5"]).percent}%`} percentBlue={streaks?.over?.["4.5"]?.active ? `${streaks.over["4.5"].percent}%` : "–"} />
          <StatRow label="Over 5.5" count={`(${val(over["5.5"]).raw}/${total})`} percentGreen={`${val(over["5.5"]).percent}%`} percentBlue={streaks?.over?.["5.5"]?.active ? `${streaks.over["5.5"].percent}%` : "–"} />
        </div>
        <div className="space-y-1">
          <StatRow label="Under 0.5" count={`(${val(under["0.5"]).raw}/${total})`} percentGreen={`${val(under["0.5"]).percent}%`} percentBlue={streaks?.under?.["0.5"]?.active ? `${streaks.under["0.5"].percent}%` : "–"} />
          <StatRow label="Under 1.5" count={`(${val(under["1.5"]).raw}/${total})`} percentGreen={`${val(under["1.5"]).percent}%`} percentBlue={streaks?.under?.["1.5"]?.active ? `${streaks.under["1.5"].percent}%` : "–"} />
          <StatRow label="Under 2.5" count={`(${val(under["2.5"]).raw}/${total})`} percentGreen={`${val(under["2.5"]).percent}%`} percentBlue={streaks?.under?.["2.5"]?.active ? `${streaks.under["2.5"].percent}%` : "–"} />
          <StatRow label="Under 3.5" count={`(${val(under["3.5"]).raw}/${total})`} percentGreen={`${val(under["3.5"]).percent}%`} percentBlue={streaks?.under?.["3.5"]?.active ? `${streaks.under["3.5"].percent}%` : "–"} />
          <StatRow label="Under 4.5" count={`(${val(under["4.5"]).raw}/${total})`} percentGreen={`${val(under["4.5"]).percent}%`} percentBlue={streaks?.under?.["4.5"]?.active ? `${streaks.under["4.5"].percent}%` : "–"} />
          <StatRow label="Under 5.5" count={`(${val(under["5.5"]).raw}/${total})`} percentGreen={`${val(under["5.5"]).percent}%`} percentBlue={streaks?.under?.["5.5"]?.active ? `${streaks.under["5.5"].percent}%` : "–"} />
        </div>
      </div>
    </div>
  );
}
