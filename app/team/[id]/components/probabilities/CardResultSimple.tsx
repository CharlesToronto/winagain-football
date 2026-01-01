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
  const percentFallback = "-";
  const win = safe(data.win);
  const draw = safe(data.draw);
  const lose = safe(data.lose);
  const btts = safe(data.btts);
  const cleanHome = safe(data.clean_home);
  const cleanAway = safe(data.clean_away);
  const showOpponent = Boolean(opponentData);
  const opponentWin = safe(opponentData?.win);
  const opponentDraw = safe(opponentData?.draw);
  const opponentLose = safe(opponentData?.lose);
  const opponentBtts = safe(opponentData?.btts);
  const opponentCleanHome = safe(opponentData?.clean_home);
  const opponentCleanAway = safe(opponentData?.clean_away);

  return (
    <div className="card bg-white/5 rounded-xl p-6 shadow">
      <h3 className="font-semibold mb-3">RAcsultats</h3>
      <div className="space-y-1">
        <StatRow
          label="Victoire"
          count={`(${win.raw}/${total})`}
          percentGreen={`${win.percent}%`}
          percentOrange={showOpponent ? `${opponentWin.percent}%` : undefined}
          percentBlue={
            resolvedStreaks?.win?.active ? `${resolvedStreaks.win.percent}%` : percentFallback
          }
        />
        <StatRow
          label="Nul"
          count={`(${draw.raw}/${total})`}
          percentGreen={`${draw.percent}%`}
          percentOrange={showOpponent ? `${opponentDraw.percent}%` : undefined}
          percentBlue={
            resolvedStreaks?.draw?.active
              ? `${resolvedStreaks.draw.percent}%`
              : percentFallback
          }
        />
        <StatRow
          label="DAcfaite"
          count={`(${lose.raw}/${total})`}
          percentGreen={`${lose.percent}%`}
          percentOrange={showOpponent ? `${opponentLose.percent}%` : undefined}
          percentBlue={
            resolvedStreaks?.lose?.active
              ? `${resolvedStreaks.lose.percent}%`
              : percentFallback
          }
        />
      </div>
      <div className="pt-3 border-t border-white/10 space-y-1">
        <div className="text-xs text-white uppercase tracking-wide font-semibold">
          Buts & scoring
        </div>
        <StatRow
          label="BTTS (Les 2 Acquipes marquent)"
          count={`(${btts.raw}/${total})`}
          percentGreen={`${btts.percent}%`}
          percentOrange={showOpponent ? `${opponentBtts.percent}%` : undefined}
          percentBlue={
            resolvedStreaks?.btts?.active
              ? `${resolvedStreaks.btts.percent}%`
              : percentFallback
          }
        />
        <StatRow
          label="Clean Sheet Home"
          count={`(${cleanHome.raw}/${total})`}
          percentGreen={`${cleanHome.percent}%`}
          percentOrange={showOpponent ? `${opponentCleanHome.percent}%` : undefined}
          percentBlue={
            resolvedStreaks?.clean_home?.active
              ? `${resolvedStreaks.clean_home.percent}%`
              : percentFallback
          }
        />
        <StatRow
          label="Clean Sheet Away"
          count={`(${cleanAway.raw}/${total})`}
          percentGreen={`${cleanAway.percent}%`}
          percentOrange={showOpponent ? `${opponentCleanAway.percent}%` : undefined}
          percentBlue={
            resolvedStreaks?.clean_away?.active
              ? `${resolvedStreaks.clean_away.percent}%`
              : percentFallback
          }
        />
      </div>
    </div>
  );
}
