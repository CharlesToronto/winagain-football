import { useMemo } from "react";
import { useCible } from "@/app/components/cible/CibleContext";

type Fixture = any;

type HalfWinStats = {
  total: number;
  won: number;
  lost: number;
  percentWon: number;
  percentLost: number;
  seriesTotal: number;
};

type Location = "all" | "home" | "away";

const HIGHLIGHT_MIN = 70;
const HIGHLIGHT_MAX = 99;

function resolveIsHome(fixture: Fixture, teamId?: number | null) {
  if (typeof fixture?.isHome === "boolean") return fixture.isHome;
  if (Number.isFinite(teamId)) {
    const homeId = fixture?.home_team_id;
    if (typeof homeId === "number") return homeId === teamId;
  }
  return null;
}

function matchesLocation(isHome: boolean | null, location: Location) {
  if (location === "all") return true;
  if (isHome == null) return false;
  return location === "home" ? isHome : !isHome;
}

function resolveHalfGoals(
  fixture: Fixture,
  isHome: boolean
): {
  first: { team: number; opp: number };
  second: { team: number; opp: number };
} | null {
  const htHome = fixture?.goals_home_ht;
  const htAway = fixture?.goals_away_ht;
  const ftHome = fixture?.goals_home;
  const ftAway = fixture?.goals_away;
  if (htHome == null || htAway == null || ftHome == null || ftAway == null) {
    return null;
  }
  if (ftHome < htHome || ftAway < htAway) return null;

  const teamFirst = isHome ? htHome : htAway;
  const oppFirst = isHome ? htAway : htHome;
  const teamSecond = isHome ? ftHome - htHome : ftAway - htAway;
  const oppSecond = isHome ? ftAway - htAway : ftHome - htHome;

  return {
    first: { team: teamFirst, opp: oppFirst },
    second: { team: Math.max(0, teamSecond), opp: Math.max(0, oppSecond) },
  };
}

function computeHalfWinStats(
  fixtures: Fixture[] = [],
  teamId?: number | null,
  location: Location = "all"
): HalfWinStats {
  const seriesTotal = (fixtures ?? []).length;
  const scoped = (fixtures ?? []).filter((fixture) =>
    matchesLocation(resolveIsHome(fixture, teamId), location)
  );
  let totalMatches = 0;
  let wonAtLeastOneHalf = 0;
  let lostAtLeastOneHalf = 0;

  scoped.forEach((fixture) => {
    const isHome = resolveIsHome(fixture, teamId);
    if (isHome == null) return;
    const halves = resolveHalfGoals(fixture, isHome);
    if (!halves) return;
    totalMatches += 1;
    const wonFirst = halves.first.team > halves.first.opp;
    const wonSecond = halves.second.team > halves.second.opp;
    const lostFirst = halves.first.team < halves.first.opp;
    const lostSecond = halves.second.team < halves.second.opp;
    if (wonFirst || wonSecond) {
      wonAtLeastOneHalf += 1;
    }
    if (lostFirst || lostSecond) {
      lostAtLeastOneHalf += 1;
    }
  });

  const pctWon =
    totalMatches > 0 ? Math.round((wonAtLeastOneHalf / totalMatches) * 100) : 0;
  const pctLost =
    totalMatches > 0 ? Math.round((lostAtLeastOneHalf / totalMatches) * 100) : 0;

  return {
    total: totalMatches,
    won: wonAtLeastOneHalf,
    lost: lostAtLeastOneHalf,
    percentWon: pctWon,
    percentLost: pctLost,
    seriesTotal,
  };
}

function isHighlightBand(value: number) {
  return value >= HIGHLIGHT_MIN && value <= HIGHLIGHT_MAX;
}

export default function CardHalfWinRate({
  fixtures = [],
  opponentFixtures = [],
  showOpponentComparison,
  highlightActive,
  teamId,
  location = "all",
}: {
  fixtures?: Fixture[];
  opponentFixtures?: Fixture[];
  showOpponentComparison?: boolean;
  highlightActive?: boolean;
  teamId?: number | null;
  location?: Location;
}) {
  const cible = useCible();
  const cibleActive = Boolean(cible?.active);
  const selectionCategory = "Au moins une mi-temps";
  const selectable = cibleActive && cible;

  const teamStats = useMemo(
    () => computeHalfWinStats(fixtures ?? [], teamId, location),
    [fixtures, teamId, location]
  );
  const opponentStats = useMemo(
    () => computeHalfWinStats(opponentFixtures ?? [], undefined, location),
    [opponentFixtures, location]
  );
  const opponentAvailable = Boolean(opponentFixtures?.length);
  const showOpponent = Boolean(showOpponentComparison && opponentAvailable);
  const { total, won, lost, percentWon, percentLost, seriesTotal } = teamStats;
  const { total: opponentTotal, won: opponentWon, lost: opponentLost } = opponentStats;

  const percentWonLabel = total > 0 ? `${percentWon}%` : "--";
  const percentLostLabel = total > 0 ? `${percentLost}%` : "--";
  const opponentPercentWonLabel =
    showOpponent && opponentTotal > 0 ? `${opponentStats.percentWon}%` : "--";
  const opponentPercentLostLabel =
    showOpponent && opponentTotal > 0 ? `${opponentStats.percentLost}%` : "--";

  const highlightWon =
    Boolean(highlightActive && opponentAvailable) &&
    total > 0 &&
    opponentTotal > 0 &&
    isHighlightBand(percentWon) &&
    isHighlightBand(opponentStats.percentWon);
  const highlightLost =
    Boolean(highlightActive && opponentAvailable) &&
    total > 0 &&
    opponentTotal > 0 &&
    isHighlightBand(percentLost) &&
    isHighlightBand(opponentStats.percentLost);

  const handleSelect = (label: string, percent: number, opponentPercent?: number) => {
    if (!selectable) return;
    cible.addSelection({
      marketLabel: label,
      marketCategory: selectionCategory,
      percentGreen: Number.isFinite(percent) ? percent : null,
      percentOrange: showOpponent && Number.isFinite(opponentPercent)
        ? opponentPercent
        : null,
    });
  };

  const selectableClass = selectable
    ? "cursor-pointer hover:bg-white/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-400/50"
    : "";

  return (
    <div className="bg-white/5 rounded-xl p-6 shadow flex flex-col md:h-[20rem]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold">Au moins une mi-temps</h3>
          <p className="text-xs text-white/70">
            L'équipe gagne ou perd la 1re ou la 2e mi-temps.
          </p>
          <p className="text-xs text-white/50">Série de {seriesTotal} match(s)</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div
          role={selectable ? "button" : undefined}
          tabIndex={selectable ? 0 : undefined}
          onClick={selectable ? () => handleSelect("Gagnée", percentWon, opponentStats.percentWon) : undefined}
          onKeyDown={
            selectable
              ? (event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleSelect("Gagnée", percentWon, opponentStats.percentWon);
                  }
                }
              : undefined
          }
          className={`rounded-lg p-3 border ${selectableClass} ${
            highlightWon
              ? "bg-yellow-400/10 ring-1 ring-yellow-300/40 border-yellow-200/40"
              : "bg-white/5 border-white/5"
          }`}
        >
          <div className="text-xs text-white/70">Gagnée</div>
          <div className="mt-1 flex items-end justify-between gap-3">
            <div>
              <div
                className={`text-2xl font-semibold ${
                  highlightWon ? "text-yellow-200" : "text-emerald-300"
                }`}
              >
                {percentWonLabel}
              </div>
              <div className="text-xs text-white/70">
                ({won}/{total})
              </div>
            </div>
            {showOpponent && (
              <div className="text-right">
                <div className="text-2xl font-semibold text-orange-300">
                  {opponentPercentWonLabel}
                </div>
                <div className="text-xs text-white/60">
                  ({opponentWon}/{opponentTotal})
                </div>
              </div>
            )}
          </div>
        </div>
        <div
          role={selectable ? "button" : undefined}
          tabIndex={selectable ? 0 : undefined}
          onClick={selectable ? () => handleSelect("Perdu", percentLost, opponentStats.percentLost) : undefined}
          onKeyDown={
            selectable
              ? (event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleSelect("Perdu", percentLost, opponentStats.percentLost);
                  }
                }
              : undefined
          }
          className={`rounded-lg p-3 border ${selectableClass} ${
            highlightLost
              ? "bg-yellow-400/10 ring-1 ring-yellow-300/40 border-yellow-200/40"
              : "bg-white/5 border-white/5"
          }`}
        >
          <div className="text-xs text-white/70">Perdu</div>
          <div className="mt-1 flex items-end justify-between gap-3">
            <div>
              <div
                className={`text-2xl font-semibold ${
                  highlightLost ? "text-yellow-200" : "text-emerald-300"
                }`}
              >
                {percentLostLabel}
              </div>
              <div className="text-xs text-white/70">
                ({lost}/{total})
              </div>
            </div>
            {showOpponent && (
              <div className="text-right">
                <div className="text-2xl font-semibold text-orange-300">
                  {opponentPercentLostLabel}
                </div>
                <div className="text-xs text-white/60">
                  ({opponentLost}/{opponentTotal})
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 text-xs text-white/60">
        {total > 0
          ? `Basé sur ${total} match(s) avec score mi-temps.`
          : "Aucune donnée mi-temps disponible."}
      </div>
    </div>
  );
}
