import StatRow from "./StatRow";

export default function CardDoubleChance({ data, streaks }: { data: any; streaks: any }) {
  if (!data) return null;
  const resolvedStreaks = data?.streaks ?? streaks ?? {};
  const total = data.total ?? 0;
  const safe = (obj: any) => ({
    raw: obj?.raw ?? obj?.count ?? 0,
    percent: obj?.percent ?? 0,
  });
  const dc1x = safe(data.dc_1x);
  const dcx2 = safe(data.dc_x2);
  const dc12 = safe(data.dc_12);

  return (
    <div className="card bg-white/5 rounded-xl p-6 shadow">
      <h3 className="font-semibold mb-3">Double chance</h3>
      <div className="space-y-1">
        <StatRow
          label="1X"
          count={`(${dc1x.raw}/${total})`}
          percentGreen={`${dc1x.percent}%`}
          percentBlue={resolvedStreaks?.dc_1x?.active ? `${resolvedStreaks.dc_1x.percent}%` : "–"}
        />
        <StatRow
          label="X2"
          count={`(${dcx2.raw}/${total})`}
          percentGreen={`${dcx2.percent}%`}
          percentBlue={resolvedStreaks?.dc_x2?.active ? `${resolvedStreaks.dc_x2.percent}%` : "–"}
        />
        <StatRow
          label="12"
          count={`(${dc12.raw}/${total})`}
          percentGreen={`${dc12.percent}%`}
          percentBlue={resolvedStreaks?.dc_12?.active ? `${resolvedStreaks.dc_12.percent}%` : "–"}
        />
      </div>
    </div>
  );
}
