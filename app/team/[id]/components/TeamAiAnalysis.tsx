"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { getProbabilityEngines } from "@/lib/adapters/probabilities";

type FilterKey = "FT" | "HT" | "2H";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
};

type Props = {
  team: Record<string, any> | null;
  league: Record<string, any> | null;
  nextMatch: Record<string, any> | null;
  fixtures: Record<string, any>[];
  opponentFixtures: Record<string, any>[];
  filter: FilterKey;
  nextOpponentName?: string | null;
};

const CHAT_CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_CHAT_MESSAGES = 12;

function createMessageId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function TeamAiAnalysis({
  team,
  league,
  nextMatch,
  fixtures,
  opponentFixtures,
  filter,
  nextOpponentName,
}: Props) {
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [chatError, setChatError] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [cacheTimestamp, setCacheTimestamp] = useState<number | null>(null);

  const { engines, computeStreaks } = getProbabilityEngines();
  const computeEngine = engines[filter];

  const stats = useMemo(() => computeEngine(fixtures ?? []), [computeEngine, fixtures]);
  const streaks = useMemo(() => computeStreaks(fixtures ?? []), [computeStreaks, fixtures]);
  const opponentStats = useMemo(
    () => (opponentFixtures?.length ? computeEngine(opponentFixtures) : null),
    [computeEngine, opponentFixtures]
  );
  const opponentStreaks = useMemo(
    () => (opponentFixtures?.length ? computeStreaks(opponentFixtures) : null),
    [computeStreaks, opponentFixtures]
  );

  const payload = useMemo(
    () => ({
      filter,
      team: {
        id: team?.id ?? null,
        name: team?.name ?? null,
        league: league?.name ?? null,
      },
      nextOpponent: {
        name: nextOpponentName ?? null,
      },
      nextMatch: nextMatch
        ? {
            date: nextMatch?.fixture?.date ?? nextMatch?.fixture?.timestamp ?? null,
            venue: nextMatch?.fixture?.venue?.name ?? null,
            status: nextMatch?.fixture?.status?.short ?? null,
          }
        : null,
      fixturesCount: fixtures?.length ?? 0,
      opponentFixturesCount: opponentFixtures?.length ?? 0,
      stats,
      streaks,
      opponentStats,
      opponentStreaks,
    }),
    [
      filter,
      team,
      league,
      nextOpponentName,
      nextMatch,
      fixtures,
      opponentFixtures,
      stats,
      streaks,
      opponentStats,
      opponentStreaks,
    ]
  );

  const fixturesCount = fixtures?.length ?? 0;
  const opponentFixturesCount = opponentFixtures?.length ?? 0;
  const cacheKey = useMemo(() => {
    if (!team?.id) return null;
    return `team-ai-chat:${team.id}:${filter}:${fixturesCount}:${opponentFixturesCount}`;
  }, [team?.id, filter, fixturesCount, opponentFixturesCount]);

  useEffect(() => {
    if (!cacheKey) return;
    try {
      const raw = localStorage.getItem(cacheKey);
      if (!raw) {
        setAnalysis("");
        setMessages([]);
        setCacheTimestamp(null);
        return;
      }
      const parsed = JSON.parse(raw);
      const updatedAt = Number(parsed?.updatedAt ?? 0);
      if (!updatedAt || Date.now() - updatedAt > CHAT_CACHE_TTL_MS) {
        localStorage.removeItem(cacheKey);
        setAnalysis("");
        setMessages([]);
        setCacheTimestamp(null);
        return;
      }
      setAnalysis(typeof parsed?.analysis === "string" ? parsed.analysis : "");
      setMessages(Array.isArray(parsed?.messages) ? parsed.messages : []);
      setCacheTimestamp(updatedAt);
    } catch {
      setAnalysis("");
      setMessages([]);
      setCacheTimestamp(null);
    }
  }, [cacheKey]);

  useEffect(() => {
    if (!cacheKey) return;
    if (!analysis && messages.length === 0) {
      localStorage.removeItem(cacheKey);
      setCacheTimestamp(null);
      return;
    }
    const updatedAt = Date.now();
    const cached = { analysis, messages, updatedAt };
    localStorage.setItem(cacheKey, JSON.stringify(cached));
    setCacheTimestamp(updatedAt);
  }, [cacheKey, analysis, messages]);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/team-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload }),
      });
      const json = await res.json();
      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || "Echec de l'analyse IA");
      }
      setAnalysis(json?.analysis ?? "");
    } catch (err: any) {
      setAnalysis("");
      setError(err?.message ?? "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    if (!analysis) {
      setChatError("Lance l'analyse avant de poser une question.");
      return;
    }
    if (streaming) return;

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content: trimmed,
      createdAt: Date.now(),
    };
    const assistantMessage: ChatMessage = {
      id: createMessageId(),
      role: "assistant",
      content: "",
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
    setStreaming(true);
    setChatError(null);

    const contextMessages = [...messages, userMessage]
      .slice(-MAX_CHAT_MESSAGES)
      .map((msg) => ({ role: msg.role, content: msg.content }));

    try {
      const res = await fetch("/api/ai/team-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis,
          payload,
          messages: contextMessages,
          filter,
          teamName: team?.name ?? null,
          opponentName: nextOpponentName ?? null,
        }),
      });

      if (!res.ok || !res.body) {
        const text = await res.text();
        throw new Error(text || "Erreur IA.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id
              ? { ...msg, content: assistantText }
              : msg
          )
        );
      }
    } catch (err: any) {
      setChatError(err?.message ?? "Erreur inconnue.");
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessage.id));
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="max-w-5xl">
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-white space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Analyse IA</h2>
            <p className="text-xs text-white/70">
              Basee sur les calculs Probabilites (filtre: {filter}).
            </p>
          </div>
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading}
            className={`px-4 py-2 rounded-md text-sm font-semibold ${
              loading ? "bg-white/20 text-white/60" : "bg-green-600 hover:bg-green-500"
            }`}
          >
            {loading ? "Analyse..." : "Analyser"}
          </button>
        </div>

        {error ? (
          <div className="text-red-300 text-sm bg-red-900/30 border border-red-500/20 rounded-lg p-3">
            {error}
          </div>
        ) : null}

        {analysis ? (
          <div className="text-sm text-white/90 whitespace-pre-line">
            {analysis}
          </div>
        ) : (
          <div className="text-sm text-white/60">
            Clique sur Analyser pour obtenir le bilan de l'equipe et du prochain adversaire.
          </div>
        )}

        <div className="border-t border-white/10 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Chat IA</h3>
            <span className="text-[11px] text-white/50">
              Cache local 1h
              {cacheTimestamp
                ? ` | MAJ ${new Date(cacheTimestamp).toLocaleTimeString("fr-FR")}`
                : ""}
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
            {messages.length === 0 ? (
              <div className="text-xs text-white/60">
                Pose une question sur l'analyse (ex: forces, faiblesses, points cle).
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-white/10 text-white"
                      : "bg-emerald-500/10 text-emerald-100"
                  }`}
                >
                  {msg.content}
                </div>
              ))
            )}
          </div>

          {chatError ? (
            <div className="text-red-300 text-xs bg-red-900/30 border border-red-500/20 rounded-lg p-2">
              {chatError}
            </div>
          ) : null}

          <form onSubmit={handleSend} className="flex flex-col sm:flex-row gap-2">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ecris ta question..."
              rows={2}
              className="flex-1 rounded-md bg-black/30 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-emerald-400/60"
              disabled={streaming}
            />
            <button
              type="submit"
              disabled={streaming || !analysis}
              className={`px-4 py-2 rounded-md text-sm font-semibold ${
                streaming || !analysis
                  ? "bg-white/20 text-white/50"
                  : "bg-emerald-500 hover:bg-emerald-400 text-white"
              }`}
            >
              {streaming ? "Envoi..." : "Envoyer"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
