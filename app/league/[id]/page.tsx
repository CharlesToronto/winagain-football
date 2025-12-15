import { fetchApi } from "@/lib/football";
import StandingsList from "./StandingsList";

export default async function LeaguePage({ params }) {
  const data = await fetchApi("standings", {
    league: params.id,
    season: 2025,
  });

  const table = data.response?.[0]?.league?.standings?.[0] || [];

  // Map prochain adversaire par équipe (via prochains matchs de championnat)
  let opponentByTeam: Record<number, number | undefined> = {};
  try {
    const fixturesData = await fetchApi("fixtures", {
      league: params.id,
      season: 2025,
      next: 50,
    });

    const upcoming = fixturesData?.response || [];
    const nextByTeam: Record<number, { opponentId: number; date: number }> = {};

    const updateNext = (teamId?: number, opponentId?: number, date?: number) => {
      if (!teamId || !opponentId || !date) return;
      const existing = nextByTeam[teamId];
      if (!existing || date < existing.date) {
        nextByTeam[teamId] = { opponentId, date };
      }
    };

    upcoming.forEach((match: any) => {
      const date = new Date(match?.fixture?.date ?? 0).getTime();
      const homeId = match?.teams?.home?.id;
      const awayId = match?.teams?.away?.id;
      updateNext(homeId, awayId, date);
      updateNext(awayId, homeId, date);
    });

    opponentByTeam = Object.fromEntries(
      Object.entries(nextByTeam).map(([teamId, value]) => [teamId, value.opponentId])
    );
  } catch (e) {
    opponentByTeam = {};
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">League #{params.id}</h1>

      {table.length === 0 ? (
        <p>No standings available.</p>
      ) : (
        <StandingsList table={table} opponentByTeam={opponentByTeam} />
      )}
    </div>
  );
}
