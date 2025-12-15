import StatRow from "./statrow";

export default function CardHalfFull({ data }) {
  const statsEngine = data;
  const streaks = data?.streaks ?? {};
  console.log("📘 CARD streaks:", streaks);
  if (!statsEngine) return null;
  const total = statsEngine.total ?? 0;
  const win = statsEngine.win ?? { raw: 0, percent: 0 };
  const draw = statsEngine.draw ?? { raw: 0, percent: 0 };
  const lose = statsEngine.lose ?? { raw: 0, percent: 0 };

  return (
    <div className="bg-white/5 rounded-xl p-6 shadow">
      <h3 className="font-semibold mb-3">Mi-temps / Match</h3>
      <div className="space-y-1">
        <StatRow label="Victoire" count={`(${win.raw ?? 0}/${total})`} percentGreen={`${win.percent ?? 0}%`} percentBlue={streaks?.win?.active ? `${streaks.win.percent}%` : "–"} />
        <StatRow label="Nul" count={`(${draw.raw ?? 0}/${total})`} percentGreen={`${draw.percent ?? 0}%`} percentBlue={streaks?.draw?.active ? `${streaks.draw.percent}%` : "–"} />
        <StatRow label="Défaite" count={`(${lose.raw ?? 0}/${total})`} percentGreen={`${lose.percent ?? 0}%`} percentBlue={streaks?.lose?.active ? `${streaks.lose.percent}%` : "–"} />
      </div>
    </div>
  );
}
