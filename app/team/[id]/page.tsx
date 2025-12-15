"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import ProbabilitiesView from "./components/probabilities/ProbabilitiesView";
import { loadTeamData, TeamAdapterResult } from "@/lib/adapters/team";

type StatsState = Record<string, any> | null;
type TeamData = Record<string, any> | null;
type LeagueData = Record<string, any> | null;
type FixtureItem = Record<string, any>;
type NextMatch = Record<string, any> | null;

export default function TeamPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();

  const [tab, setTab] = useState<"dashboard" | "stats">("dashboard");
  const [team, setTeam] = useState<TeamData>(null);
  const [league, setLeague] = useState<LeagueData>(null);
  const [stats, setStats] = useState<StatsState>(null);
  const [range, setRange] = useState<50 | 40 | 30 | 20 | 10 | "season">("season");
  const [fixtures, setFixtures] = useState<FixtureItem[]>([]);
  const [nextMatch, setNextMatch] = useState<NextMatch>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        const result: TeamAdapterResult = await loadTeamData(id, range);
        setTeam(result.team);
        setLeague(result.league);
        setFixtures(result.fixtures);
        setStats(result.stats);
        setNextMatch(result.nextMatch);
      } catch (e) {
        setStats(null);
        setFixtures([]);
      }
      setLoading(false);
    }

    load();
  }, [id, range]);

  if (loading) return <p className="p-6 text-white">Chargement...</p>;
  if (!team) return <p className="p-6 text-white">Aucune donnée trouvée.</p>;

  const analysis = fixtures;

  return (
    <div className="min-h-screen w-full p-6 text-white">
      <div className="mb-6 flex items-center gap-3 text-sm opacity-80">
        <Link href="/leagues" className="hover:underline">Leagues</Link>
        <span>/</span>
        {league ? (
          <Link href={`/league/${league.id}`} className="hover:underline">
            Championnat
          </Link>
        ) : (
          <button onClick={() => router.back()} className="hover:underline">Championnat</button>
        )}
        <span>/</span>
        <span className="font-semibold">{team.name}</span>
      </div>

      <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm border border-white/10 p-4 rounded-xl w-fit mb-6 text-white">
        {team.logo && (
          <img
            src={team.logo}
            alt={team.name}
            className="w-20 h-20 object-contain drop-shadow-lg"
          />
        )}

        <div>
          <h1 className="text-3xl font-bold">{team.name}</h1>
          {league && <p className="text-sm opacity-80 mt-1">{league.name} — Season 2025</p>}
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        {[50, 40, 30, 20, 10].map((n) => (
          <button
            key={n}
            onClick={() => setRange(n)}
            className={`px-2 py-1 text-sm rounded ${
              range === n
                ? "bg-green-600 text-white"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            {n} matchs
          </button>
        ))}

        <button
          onClick={() => setRange("season")}
          className={`px-2 py-1 text-sm rounded ${
            range === "season"
              ? "bg-green-600 text-white"
              : "bg-white/20 text-white hover:bg-white/30"
          }`}
        >
          Saison 2025
        </button>
      </div>

      <div className="flex gap-4 mb-6 border-b pb-2">
        <button
          onClick={() => setTab("dashboard")}
          className={
            tab === "dashboard"
              ? "pb-2 border-b-2 border-white font-semibold text-white"
              : "opacity-60 text-white/60 hover:text-white"
          }
        >
          Dashboard
        </button>

        <button
          onClick={() => setTab("stats")}
          className={
            tab === "stats"
              ? "pb-2 border-b-2 border-white font-semibold text-white"
              : "opacity-60 text-white/60 hover:text-white"
          }
        >
          Probabilités
        </button>
      </div>

      {tab === "dashboard" ? (
        <DashboardView
          stats={stats}
          league={league}
          fixtures={fixtures}
          team={team}
          nextMatch={nextMatch}
        />
      ) : (
        <ProbabilitiesView fixtures={fixtures} />
      )}

      <div className="mb-6 mt-6 p-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded text-white">
        <h2 className="font-semibold mb-2">Debug fixtures</h2>
        <p className="text-xs opacity-70 text-white/70">
          Matchs utilisés par le moteur : {stats?.played ?? 0}
        </p>
      </div>
    </div>
  );
}

function DashboardView({
  stats,
  league,
  fixtures,
  team,
  nextMatch,
}: {
  stats: any;
  league: any;
  fixtures: FixtureItem[];
  team: any;
  nextMatch: NextMatch;
}) {
  if (!stats) return <p className="opacity-60">Aucune statistique disponible.</p>;

  const [showAllForm, setShowAllForm] = useState<boolean>(false);
  const teamId = Number(team?.id);
  const fixturesLimited = fixtures || [];

  // Filtrer les fixtures valides (sécurise contre undefined)
  const validFixtures = fixturesLimited.filter(
    (f) => f?.fixture?.date
  );

  // Trier avec fallback sécurisé
  const fixturesSorted = [...validFixtures].sort((a, b) => {
    const dateA = new Date(a.fixture.date).getTime();
    const dateB = new Date(b.fixture.date).getTime();
    return dateA - dateB;
  });

  const pastMatches = fixturesSorted.filter(
    (f) => new Date(f.fixture.date).getTime() < Date.now()
  );

  const futureMatches = fixturesSorted.filter(
    (f) => new Date(f.fixture.date).getTime() >= Date.now()
  );

  const lastPlayed = pastMatches[pastMatches.length - 1] || null;

  // Premier match futur valide
  const computedNextMatch = nextMatch || futureMatches[0] || null;
  const formMatches = showAllForm ? fixturesLimited : fixturesLimited.slice(0, 5);
  const formLettersFull = fixturesLimited.map((f) => {
    const gf = f.isHome ? f.goals_home : f.goals_away;
    const ga = f.isHome ? f.goals_away : f.goals_home;

    if (gf > ga) return "W";
    if (gf < ga) return "L";
    return "D";
  });
  const formLine = formLettersFull.slice(0, 10);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

      <div className="p-5 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl text-white md:col-span-2">
        <h2 className="font-semibold text-lg mb-3">Résumé</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Stat label="Matchs joués" value={stats.played} />
          <Stat label="Victoires" value={stats.wins} />
          <Stat label="Nuls" value={stats.draws} />
          <Stat label="Défaites" value={stats.losses} />
          <Stat label="Buts marqués" value={stats.goalsFor} />
          <Stat label="Buts encaissés" value={stats.goalsAgainst} />
        </div>
      </div>

      <div className="p-5 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl text-white">
        <div className="flex flex-col gap-2 w-full">
          <h2 className="text-lg font-semibold mb-2">Prochain match</h2>

          {!computedNextMatch ? (
            <p>Aucun prochain match.</p>
          ) : (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-3">

              {/* Date + Heure + Journée */}
              <div className="text-sm text-gray-300">
                {format(new Date(computedNextMatch.fixture.date), "dd MMM yyyy")} •{" "}
                {format(new Date(computedNextMatch.fixture.date), "HH:mm")}  
                {computedNextMatch.league.round ? (
                    <> • Journée {computedNextMatch.league.round.replace("Regular Season - ", "")}</>
                ) : null}
              </div>

              {/* Match Banner */}
              <div className="flex justify-between items-center w-full">

                {/* Home */}
                <div className="flex flex-col items-center w-1/3">
                    <img
                        src={computedNextMatch.teams.home.logo}
                        alt={computedNextMatch.teams.home.name}
                        className="w-12 h-12"
                    />
                    <p className="mt-2 font-semibold">{computedNextMatch.teams.home.name}</p>
                </div>

                {/* Score or VS */}
                <div className="flex flex-col items-center w-1/3">
                    {computedNextMatch.fixture.status.short === "NS" ? (
                        <p className="text-lg font-bold">VS</p>
                    ) : (
                        <p className="text-lg font-bold">
                            {computedNextMatch.goals.home} - {computedNextMatch.goals.away}
                        </p>
                    )}
                    <p className="text-xs text-gray-300">{computedNextMatch.league.name}</p>
                </div>

                {/* Away */}
                <div className="flex flex-col items-center w-1/3">
                    <img
                        src={computedNextMatch.teams.away.logo}
                        alt={computedNextMatch.teams.away.name}
                        className="w-12 h-12"
                    />
                    <p className="mt-2 font-semibold">{computedNextMatch.teams.away.name}</p>
                </div>
              </div>

              {/* Stade */}
              {computedNextMatch.fixture.venue?.name && (
                  <p className="text-xs text-gray-400 text-center mt-1">
                    Stade : {computedNextMatch.fixture.venue.name}
                  </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 p-6 text-white md:col-span-3">
        <h2 className="text-xl font-semibold mb-4">Forme</h2>

        {/* SÉRIE */}
        <div className="text-sm font-bold mt-1 mb-3">
          {formLine.map((letter, idx) => {
            const isFirst = idx === 0;
            const colorClass = !isFirst
              ? ""
              : letter === "W"
              ? "text-green-400"
              : letter === "L"
              ? "text-red-400"
              : "text-blue-400";

            return (
              <span key={idx}>
                {idx > 0 && " - "}
                <span className={colorClass}>{letter}</span>
              </span>
            );
          })}
        </div>

        {/* LISTE DÉTAILLÉE DES MATCHS */}
        <div className="space-y-1">
          {formMatches.map((f: any, idx: number) => {
            const match = {
              date: f.date_utc,
              home: { name: f.home_team_name, logo: f.home_team_logo },
              away: { name: f.away_team_name, logo: f.away_team_logo },
              gh: f.goals_home,
              ga: f.goals_away,
            };

            return (
              <div
                key={f.id ?? idx}
                className="flex items-center justify-between py-2 text-sm border-b border-white/10 last:border-0"
              >
                {/* DATE */}
                <div className="w-24 text-white/70">
                  {format(new Date(match.date), "dd MMM yyyy")}
                </div>

                {/* MATCH */}
                <div className="flex-1 flex items-center justify-center gap-6">

                  {/* HOME */}
                  <div className="flex items-center justify-start gap-2 w-40">
                    {match.home.logo && <img src={match.home.logo} className="w-5 h-5" />}
                    <span className="font-medium">{match.home.name}</span>
                  </div>

                  {/* SCORE */}
                  <div className="text-lg font-semibold w-12 text-center">
                    {match.gh} - {match.ga}
                  </div>

                  {/* AWAY */}
                  <div className="flex items-center justify-end gap-2 w-40">
                    <span className="font-medium text-right">{match.away.name}</span>
                    {match.away.logo && <img src={match.away.logo} className="w-5 h-5" />}
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {fixturesLimited.length > 5 && (
          <div className="text-center mt-3">
            <button
              onClick={() => setShowAllForm(!showAllForm)}
              className="text-white text-sm font-semibold hover:underline"
            >
              {showAllForm ? "Réduire" : "Voir plus"}
            </button>
          </div>
        )}
      </div>

    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-white/70">{label}</span>
      <span className="text-lg font-semibold text-white">{value}</span>
    </div>
  );
}
