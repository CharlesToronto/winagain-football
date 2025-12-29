import StatRow from "./StatRow";

export default function CardResultSimple({
  data,
  streaks,
  opponentData,
}: {
  data: any;
  streaks: any;
  opponentData?: any;
}) {
  if (!data) return null;
  const resolvedStreaks = data?.streaks ?? streaks ?? {};
  const total = data.total ?? 0;
  const safe = (obj: any) => ({
    raw: obj?.raw ?? obj?.count ?? 0,
    percent: obj?.percent ?? 0,
  });
  const win = safe(data.win);
  const draw = safe(data.draw);
  const lose = safe(data.lose);
  const showOpponent = Boolean(opponentData);
  const opponentWin = safe(opponentData?.win);
  const opponentDraw = safe(opponentData?.draw);
  const opponentLose = safe(opponentData?.lose);

  return (
    <div className="card bg-white/5 rounded-xl p-6 shadow">
      <h3 className="font-semibold mb-3">Résultats</h3>
      <div className="space-y-1">
        <StatRow
          label="Victoire"
          count={`(${win.raw}/${total})`}
          percentGreen={`${win.percent}%`}
          percentOrange={showOpponent ? `${opponentWin.percent}%` : undefined}
          percentBlue={resolvedStreaks?.win?.active ? `${resolvedStreaks.win.percent}%` : "–"}
        />
        <StatRow
          label="Nul"
          count={`(${draw.raw}/${total})`}
          percentGreen={`${draw.percent}%`}
          percentOrange={showOpponent ? `${opponentDraw.percent}%` : undefined}
          percentBlue={resolvedStreaks?.draw?.active ? `${resolvedStreaks.draw.percent}%` : "–"}
        />
        <StatRow
          label="Défaite"
          count={`(${lose.raw}/${total})`}
          percentGreen={`${lose.percent}%`}
          percentOrange={showOpponent ? `${opponentLose.percent}%` : undefined}
          percentBlue={resolvedStreaks?.lose?.active ? `${resolvedStreaks.lose.percent}%` : "–"}
        />
      </div>
    </div>
  );
}
