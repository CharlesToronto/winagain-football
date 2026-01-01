import { NextResponse } from "next/server";

type Payload = {
  filter?: string;
  team?: Record<string, any> | null;
  nextOpponent?: Record<string, any> | null;
  nextMatch?: Record<string, any> | null;
  fixturesCount?: number;
  opponentFixturesCount?: number;
  stats?: Record<string, any> | null;
  streaks?: Record<string, any> | null;
  opponentStats?: Record<string, any> | null;
  opponentStreaks?: Record<string, any> | null;
};

type CacheEntry = {
  value: string;
  createdAt: number;
};

const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 200;

const globalForCache = globalThis as typeof globalThis & {
  __teamAnalysisCache?: Map<string, CacheEntry>;
};

const analysisCache =
  globalForCache.__teamAnalysisCache ?? new Map<string, CacheEntry>();

globalForCache.__teamAnalysisCache = analysisCache;

function pruneCache(now: number) {
  analysisCache.forEach((entry, key) => {
    if (now - entry.createdAt > CACHE_TTL_MS) {
      analysisCache.delete(key);
    }
  });
  if (analysisCache.size <= CACHE_MAX_ENTRIES) return;
  const overflow = analysisCache.size - CACHE_MAX_ENTRIES;
  const keys: string[] = [];
  analysisCache.forEach((_entry, key) => {
    keys.push(key);
  });
  for (let i = 0; i < overflow; i += 1) {
    const key = keys[i];
    if (!key) break;
    analysisCache.delete(key);
  }
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "OPENAI_API_KEY is not set." },
      { status: 500 }
    );
  }

  let body: { payload?: Payload } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const payload = body?.payload ?? {};
  const now = Date.now();
  pruneCache(now);
  const cacheKey = JSON.stringify(payload);
  const cached = analysisCache.get(cacheKey);
  if (cached && now - cached.createdAt <= CACHE_TTL_MS) {
    return NextResponse.json(
      { ok: true, analysis: cached.value, cached: true },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, max-age=3600",
          "X-Cache": "HIT",
        },
      }
    );
  }

  const systemPrompt =
    "Tu es un analyste football. Tu dois resumer la situation de l'equipe et du prochain adversaire " +
    "a partir des donnees JSON. Reponds en francais, concis, clair, sans inventer. " +
    "Format Markdown strict: " +
    "## Bilan (3-5 phrases) " +
    "## Points cles (3-6 puces avec '-') " +
    "Si une liste est demandee, reponds en liste Markdown. " +
    "Si une info manque, dis-le clairement. " +
    "Mets en avant les stats entre 70-100% ou 0-30% si elles existent. " +
    "Les listes de matchs sont ordonnees du plus recent au plus ancien. " +
    "Base l'analyse sur stats/streaks (selection) et utilise recentFixtures/recentStats (50 matchs) pour comparer si besoin.";
  const userPrompt = `Donnees JSON:\n${JSON.stringify(payload)}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { ok: false, error: "OpenAI request failed.", details: errorText },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content ?? "";
    analysisCache.set(cacheKey, { value: content, createdAt: now });
    return NextResponse.json(
      { ok: true, analysis: content, cached: false },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, max-age=3600",
          "X-Cache": "MISS",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? "OpenAI request error." },
      { status: 500 }
    );
  }
}
