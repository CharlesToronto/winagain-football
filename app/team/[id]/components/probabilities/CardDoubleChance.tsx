import StatRow from "./StatRow";

export default function CardDoubleChance({
  data,
  streaks,
  opponentData,
  highlightKeys,
  highlightActive,
}: {
  data: any;
  streaks: any;
  opponentData?: any;
  highlightKeys?: Set<string>;
  highlightActive?: boolean;
}) {
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
  const showOpponent = Boolean(opponentData);
  const opponentDc1x = safe(opponentData?.dc_1x);
  const opponentDcx2 = safe(opponentData?.dc_x2);
  const opponentDc12 = safe(opponentData?.dc_12);
  const shouldHighlight = (key: "1x" | "x2" | "12") =>
    Boolean(highlightActive && highlightKeys?.has(`dc:${key}`));

  return (
    <div className="card bg-white/5 rounded-xl p-6 shadow">
      <h3 className="font-semibold mb-3">Double chance</h3>
      <div className="space-y-1">
        <StatRow
          label="1X"
          count={`(${dc1x.raw}/${total})`}
          percentGreen={`${dc1x.percent}%`}
          percentOrange={showOpponent ? `${opponentDc1x.percent}%` : undefined}
          highlight={shouldHighlight("1x")}
          percentBlue={resolvedStreaks?.dc_1x?.active ? `${resolvedStreaks.dc_1x.percent}%` : "-"}
        />
        <StatRow
          label="X2"
          count={`(${dcx2.raw}/${total})`}
          percentGreen={`${dcx2.percent}%`}
          percentOrange={showOpponent ? `${opponentDcx2.percent}%` : undefined}
          highlight={shouldHighlight("x2")}
          percentBlue={resolvedStreaks?.dc_x2?.active ? `${resolvedStreaks.dc_x2.percent}%` : "-"}
        />
        <StatRow
          label="12"
          count={`(${dc12.raw}/${total})`}
          percentGreen={`${dc12.percent}%`}
          percentOrange={showOpponent ? `${opponentDc12.percent}%` : undefined}
          highlight={shouldHighlight("12")}
          percentBlue={resolvedStreaks?.dc_12?.active ? `${resolvedStreaks.dc_12.percent}%` : "-"}
        />
      </div>
    </div>
  );
}
