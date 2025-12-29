"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import ProbabilitiesView from "./components/probabilities/ProbabilitiesView";
import OddsConverter from "@/app/home/components/OddsConverter";
import computeFT from "@/lib/analysisEngine/computeFT";
import { loadTeamData, TeamAdapterResult } from "@/lib/adapters/team";
import { FAVORITES_STORAGE_KEY, type FavoriteTeam } from "@/lib/favorites";
import { getTeamFixturesAllSeasons } from "@/lib/queries/fixtures";

type StatsState = Record<string, any> | null;
type TeamData = Record<string, any> | null;
type LeagueData = Record<string, any> | null;
type FixtureItem = Record<string, any>;
type NextMatch = Record<string, any> | null;
type RangeOption = number | "season";

const CURRENT_SEASON = 2025;
const OVER_UNDER_HIGH_MIN = 75;
const OVER_UNDER_HIGH_MAX = 99;
const OVER_UNDER_LOW_MIN = 1;
const OVER_UNDER_LOW_MAX = 25;
const LAST_MATCH_TOTAL_GOALS_THRESHOLD = 3.5;
const DRAW_PERCENT_MAX = 30;

export default function TeamPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<"dashboard" | "stats" | "odds">("dashboard");
  const [team, setTeam] = useState<TeamData>(null);
  const [league, setLeague] = useState<LeagueData>(null);
  const [stats, setStats] = useState<StatsState>(null);
  const [range, setRange] = useState<RangeOption>("season");
  const [fixtures, setFixtures] = useState<FixtureItem[]>([]);
  const [nextMatch, setNextMatch] = useState<NextMatch>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteTeam[]>([]);
  const [opponentFixtures, setOpponentFixtures] = useState<FixtureItem[]>([]);
  const [overUnderHighlight, setOverUnderHighlight] = useState(false);
  const copyTimeoutRef = useRef<number | null>(null);
  const tabParam = searchParams.get("tab");
  const teamId = Number(team?.id);
  const nextOpponentId = getNextOpponentId(nextMatch, teamId);
  const nextOpponentName = getNextOpponentName(nextMatch, teamId);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleaned = parsed
          .filter((item) => item && typeof item.id === "number")
          .map((item) => ({
            id: item.id,
            name: item.name ?? "",
            logo: item.logo ?? null,
          }));
        setFavorites(cleaned);
      }
    } catch (error) {
      setFavorites([]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
      window.dispatchEvent(new Event("favorites-updated"));
    } catch (error) {
      // Ignore storage failures (private mode, blocked storage, etc.)
    }
  }, [favorites]);

  useEffect(() => {
    if (tabParam === "stats") {
      setTab("stats");
    } else if (tabParam === "dashboard") {
      setTab("dashboard");
    } else if (tabParam === "odds") {
      setTab("odds");
    }
  }, [tabParam]);

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

  useEffect(() => {
    async function loadOpponentFixtures() {
      if (!nextOpponentId) {
        setOpponentFixtures([]);
        return;
      }
      try {
        const raw = await getTeamFixturesAllSeasons(Number(nextOpponentId));
        if (!raw || raw.length === 0) {
          setOpponentFixtures([]);
          return;
        }
        const filtered = selectFixturesForRange(raw, range);
        const mapped = filtered.map((fixture: any) => ({
          ...fixture,
          isHome: fixture.home_team_id === Number(nextOpponentId),
        }));
        setOpponentFixtures(mapped);
      } catch (error) {
        setOpponentFixtures([]);
      }
    }

    loadOpponentFixtures();
  }, [nextOpponentId, range]);

  const teamStats = useMemo(
    () => (fixtures?.length ? computeFT(fixtures) : null),
    [fixtures]
  );
  const opponentStats = useMemo(
    () => (opponentFixtures?.length ? computeFT(opponentFixtures) : null),
    [opponentFixtures]
  );
  const overUnderMatchKeys = useMemo(() => {
    if (!teamStats || !opponentStats) return new Set<string>();
    return getHighlightMatchKeys(teamStats, opponentStats);
  }, [teamStats, opponentStats]);
  const overUnderMatchActive = overUnderMatchKeys.size > 0;
  const trendSignalDetails = useMemo(() => {
    const teamLast = getLatestPlayedFixture(fixtures);
    const opponentLast = getLatestPlayedFixture(opponentFixtures);
    const teamLabel = team?.name ?? "Equipe";
    const opponentLabel = nextOpponentName ?? "Adversaire";
    const teamDetail = describeTrendSignal(teamLast, teamStats, teamLabel);
    const opponentDetail = describeTrendSignal(opponentLast, opponentStats, opponentLabel);
    const reasons = [teamDetail.reason, opponentDetail.reason].filter(Boolean) as string[];
    return {
      active: reasons.length > 0,
      title: reasons.length > 0
        ? `Dernier match: ${reasons.join(" | ")}`
        : "Aucun signal sur le dernier match",
    };
  }, [fixtures, opponentFixtures, teamStats, opponentStats, team?.name, nextOpponentName]);
  const trendSignalActive = trendSignalDetails.active;

  useEffect(() => {
    if (!overUnderMatchActive) {
      setOverUnderHighlight(false);
    }
  }, [overUnderMatchActive]);

  if (loading) return <p className="p-6 text-white">Chargement...</p>;
  if (!team) return <p className="p-6 text-white">Aucune donnée trouvée.</p>;

  const isFavorite = favorites.some((fav) => fav.id === teamId);
  const toggleFavorite = () => {
    if (!Number.isFinite(teamId)) return;
    setFavorites((prev) => {
      if (prev.some((fav) => fav.id === teamId)) {
        return prev.filter((fav) => fav.id !== teamId);
      }
      return [
        ...prev,
        {
          id: teamId,
          name: team?.name ?? "",
          logo: team?.logo ?? null,
        },
      ];
    });
  };

  const analysis = fixtures;
  const overUnderTitle = overUnderMatchActive
    ? overUnderHighlight
      ? "Surlignage over/under actif"
      : "Surligner les stats 75-99% ou 1-25%"
    : "Aucun match de stats 75-99% ou 1-25%";
  const trendSignalTitle = trendSignalDetails.title;
  const copyTitle = "Copier le nom (clic) • Copier le match (double clic)";

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const clearCopyTimeout = () => {
    if (copyTimeoutRef.current !== null) {
      window.clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = null;
    }
  };

  const handleCopyClick = () => {
    clearCopyTimeout();
    copyTimeoutRef.current = window.setTimeout(() => {
      copyToClipboard(team?.name ?? "");
      copyTimeoutRef.current = null;
    }, 250);
  };

  const handleCopyDoubleClick = () => {
    clearCopyTimeout();
    const matchLabel = getNextMatchLabel(nextMatch, team?.name ?? "");
    copyToClipboard(matchLabel);
  };

  return (
    <div className="min-h-screen w-full p-6 text-white relative">
      <div className="fixed bottom-24 right-4 flex flex-wrap items-center justify-end gap-2 z-50 max-w-[90vw] md:absolute md:top-6 md:right-6 md:bottom-auto mobile-actions">
        <div
          className={`w-9 h-9 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm flex items-center justify-center transition ${
            trendSignalActive
              ? "text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.7)]"
              : "text-white/90"
          }`}
          role="img"
          aria-label={trendSignalTitle}
          title={trendSignalTitle}
        >
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 19V5m0 0l-6 6m6-6l6 6"
            />
          </svg>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!overUnderMatchActive) return;
            setOverUnderHighlight((prev) => !prev);
          }}
          disabled={!overUnderMatchActive}
          aria-pressed={overUnderHighlight}
          aria-label={overUnderTitle}
          title={overUnderTitle}
          className={`w-9 h-9 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm flex items-center justify-center transition disabled:opacity-60 disabled:cursor-not-allowed ${
            overUnderHighlight
              ? "text-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.7)]"
              : overUnderMatchActive
              ? "text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.7)]"
              : "text-white/90"
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden
          >
            <circle cx="11" cy="11" r="6" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 16.5L21 21"
            />
          </svg>
        </button>
        <span className="h-6 w-px bg-white/30" aria-hidden />
        <button
          type="button"
          onClick={toggleFavorite}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          className="w-9 h-9 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition flex items-center justify-center"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5"
            fill={isFavorite ? "#facc15" : "none"}
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.5a.7.7 0 0 1 1.04 0l2.36 2.4c.2.2.46.32.74.35l3.33.5a.7.7 0 0 1 .39 1.2l-2.4 2.35a.7.7 0 0 0-.2.62l.58 3.3a.7.7 0 0 1-1.01.74l-2.98-1.56a.7.7 0 0 0-.65 0l-2.98 1.56a.7.7 0 0 1-1.01-.74l.58-3.3a.7.7 0 0 0-.2-.62L4.8 7.95a.7.7 0 0 1 .39-1.2l3.33-.5a.7.7 0 0 0 .74-.35l2.36-2.4Z"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={handleCopyClick}
          onDoubleClick={handleCopyDoubleClick}
          className={`w-9 h-9 rounded-full bg-white/15 border border-white/20 hover:bg-white/25 flex items-center justify-center backdrop-blur-sm transition ${
            copied
              ? "text-white shadow-[0_0_12px_rgba(255,255,255,0.6)]"
              : "text-white/80 hover:text-white"
          }`}
          title={copyTitle}
          aria-label={copyTitle}
        >
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 3h7l4 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 3v4h4"
            />
          </svg>
        </button>
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm opacity-80">
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

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4 w-fit mb-6 text-white">
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

      <div className="flex flex-wrap gap-3 mb-4">
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

      <div className="flex flex-wrap gap-4 mb-6 border-b pb-2">
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

        <button
          onClick={() => setTab("odds")}
          className={
            tab === "odds"
              ? "pb-2 border-b-2 border-white font-semibold text-white"
              : "opacity-60 text-white/60 hover:text-white"
          }
        >
          Convertisseur
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
      ) : tab === "stats" ? (
        <ProbabilitiesView
          fixtures={fixtures}
          range={range}
          nextOpponentId={nextOpponentId}
          nextOpponentName={nextOpponentName}
          overUnderMatchKeys={overUnderMatchKeys}
          overUnderHighlight={overUnderHighlight}
        />
      ) : (
        <div className="max-w-4xl">
          <div className="p-6 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl text-white">
            <OddsConverter />
          </div>
        </div>
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

function selectFixturesForRange(fixtures: FixtureItem[] = [], range?: RangeOption) {
  let played = fixtures.filter(
    (fixture) => fixture.goals_home !== null && fixture.goals_away !== null
  );

  if (range === "season") {
    played = played.filter((fixture) => fixture.season === CURRENT_SEASON);
  }

  played.sort(
    (a, b) => new Date(b.date_utc).getTime() - new Date(a.date_utc).getTime()
  );

  const selectedCount = range === "season" || range == null ? played.length : range;
  return played.slice(0, selectedCount);
}

function getFixtureTimestamp(fixture: FixtureItem) {
  const raw =
    fixture?.date_utc ?? fixture?.date ?? fixture?.fixture?.date ?? fixture?.timestamp ?? null;
  if (raw == null) return 0;
  if (typeof raw === "number") {
    return raw < 1_000_000_000_000 ? raw * 1000 : raw;
  }
  const time = new Date(raw).getTime();
  return Number.isFinite(time) ? time : 0;
}

function getLatestPlayedFixture(fixtures: FixtureItem[] = []) {
  const played = fixtures.filter(
    (fixture) => fixture?.goals_home != null && fixture?.goals_away != null
  );
  let latest: FixtureItem | null = null;
  let latestTs = -Infinity;
  for (const fixture of played) {
    const ts = getFixtureTimestamp(fixture);
    if (ts > latestTs) {
      latest = fixture;
      latestTs = ts;
    }
  }
  return latest;
}

function getNextMatchLabel(nextMatch: NextMatch, fallback: string) {
  const homeName = nextMatch?.teams?.home?.name;
  const awayName = nextMatch?.teams?.away?.name;
  if (homeName && awayName) return `${homeName} VS ${awayName}`;
  return fallback;
}

function describeTrendSignal(
  fixture: FixtureItem | null,
  stats: any,
  label: string
) {
  if (!fixture) return { active: false, reason: null };
  const home = Number(fixture.goals_home ?? 0);
  const away = Number(fixture.goals_away ?? 0);
  if (!Number.isFinite(home) || !Number.isFinite(away)) {
    return { active: false, reason: null };
  }
  const totalGoals = home + away;
  const reasons: string[] = [];

  if (totalGoals > LAST_MATCH_TOTAL_GOALS_THRESHOLD) {
    reasons.push(`+${LAST_MATCH_TOTAL_GOALS_THRESHOLD} buts (${totalGoals})`);
  }

  const isDraw = home === away;
  const drawPercent = stats?.draw?.percent;
  if (
    isDraw &&
    typeof drawPercent === "number" &&
    drawPercent >= 0 &&
    drawPercent <= DRAW_PERCENT_MAX
  ) {
    reasons.push(`nul + % nuls ${drawPercent}%`);
  }

  if (reasons.length === 0) return { active: false, reason: null };
  const safeLabel = label || "Equipe";
  return { active: true, reason: `${safeLabel} ${reasons.join(" et ")}` };
}

function getHighlightBandKeySet(stats: any) {
  const matches = new Set<string>();
  const ranges = [
    { min: OVER_UNDER_HIGH_MIN, max: OVER_UNDER_HIGH_MAX, band: "high" as const },
    { min: OVER_UNDER_LOW_MIN, max: OVER_UNDER_LOW_MAX, band: "low" as const },
  ];
  const addMatches = (key: string, value: any) => {
    const percent =
      typeof value?.percent === "number" ? value.percent : Number(value?.percent ?? 0);
    if (!Number.isFinite(percent)) return;
    for (const range of ranges) {
      if (percent >= range.min && percent <= range.max) {
        matches.add(`${key}:${range.band}`);
      }
    }
  };
  const addOverUnderMatches = (label: "over" | "under", entries: Record<string, any>) => {
    for (const [key, value] of Object.entries(entries || {})) {
      addMatches(`${label}:${key}`, value);
    }
  };

  addOverUnderMatches("over", stats?.over ?? {});
  addOverUnderMatches("under", stats?.under ?? {});
  addMatches("dc:1x", stats?.dc_1x);
  addMatches("dc:x2", stats?.dc_x2);
  addMatches("dc:12", stats?.dc_12);
  return matches;
}

function getHighlightMatchKeys(teamStats: any, opponentStats: any) {
  const teamKeys = getHighlightBandKeySet(teamStats);
  const opponentKeys = getHighlightBandKeySet(opponentStats);
  const matches = new Set<string>();
  teamKeys.forEach((bandedKey) => {
    if (!opponentKeys.has(bandedKey)) return;
    const [type, key] = bandedKey.split(":");
    if (type && key) matches.add(`${type}:${key}`);
  });
  return matches;
}

function getNextOpponentId(nextMatch: NextMatch, teamId: number) {
  if (!nextMatch || !Number.isFinite(teamId)) return null;
  const homeId = nextMatch?.teams?.home?.id;
  const awayId = nextMatch?.teams?.away?.id;
  if (!homeId || !awayId) return null;
  return homeId === teamId ? awayId : homeId;
}

function getNextOpponentName(nextMatch: NextMatch, teamId: number) {
  if (!nextMatch || !Number.isFinite(teamId)) return null;
  const home = nextMatch?.teams?.home;
  const away = nextMatch?.teams?.away;
  if (!home?.id || !away?.id) return null;
  return home.id === teamId ? away?.name ?? null : home?.name ?? null;
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
  const playedMatches = stats.played ?? 0;
  const goalsFor = stats.goalsFor ?? 0;
  const goalsAgainst = stats.goalsAgainst ?? 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      <div className="p-5 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl text-white">
        <h2 className="font-semibold text-lg mb-3">Résumé</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Stat label="Matchs joués" value={stats.played} />
          <Stat label="Victoires" value={stats.wins} />
          <Stat label="Nuls" value={stats.draws} />
          <Stat label="Défaites" value={stats.losses} />
          <Stat
            label="Buts marqués"
            value={
              <>
                {goalsFor}{" "}
                <span className="text-white/25 font-normal">
                  ({formatRatio(goalsFor, playedMatches)})
                </span>
              </>
            }
          />
          <Stat
            label="Buts encaissés"
            value={
              <>
                {goalsAgainst}{" "}
                <span className="text-white/25 font-normal">
                  ({formatRatio(goalsAgainst, playedMatches)})
                </span>
              </>
            }
          />
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
                {computedNextMatch.fixture?.id ? (
                  <span className="text-xs text-white/75 font-normal">
                    {" "}
                    ({computedNextMatch.fixture.id})
                  </span>
                ) : null}
              </div>

              {/* Match Banner */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full">

                {/* Home */}
                <div className="flex flex-col items-center w-full sm:w-1/3">
                    <img
                        src={computedNextMatch.teams.home.logo}
                        alt={computedNextMatch.teams.home.name}
                        className="w-12 h-12"
                    />
                    <p className="mt-2 font-semibold">{computedNextMatch.teams.home.name}</p>
                </div>

                {/* Score or VS */}
                <div className="flex flex-col items-center w-full sm:w-1/3">
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
                <div className="flex flex-col items-center w-full sm:w-1/3">
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

      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 p-6 text-white md:col-span-2">
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
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between py-2 text-sm border-b border-white/10 last:border-0"
              >
                {/* DATE */}
                <div className="w-full sm:w-24 text-white/70">
                  {format(new Date(match.date), "dd MMM yyyy")}
                </div>

                {/* MATCH */}
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2 sm:gap-6 w-full">

                  {/* HOME */}
                  <div className="flex items-center justify-start gap-2 w-full sm:w-40">
                    {match.home.logo && <img src={match.home.logo} className="w-5 h-5" />}
                    <span className="font-medium">{match.home.name}</span>
                  </div>

                  {/* SCORE */}
                  <div className="text-lg font-semibold w-full sm:w-12 text-center">
                    {match.gh} - {match.ga}
                  </div>

                  {/* AWAY */}
                  <div className="flex items-center justify-end gap-2 w-full sm:w-40">
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

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-white/70">{label}</span>
      <span className="text-lg font-semibold text-white">{value}</span>
    </div>
  );
}

function formatRatio(value: number, total: number) {
  if (!total || total <= 0) return "0";
  const ratio = value / total;
  const rounded = Math.round(ratio * 100) / 100;
  return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(2);
}



