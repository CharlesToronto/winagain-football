"use client";

import { useState } from "react";
import CardResult from "./CardResult";
import CardOverUnder from "./CardOverUnder";
import CardGoals from "./CardGoals";
import CardCorners from "./CardCorners";
import CardCards from "./CardCards";
import CardSeries from "./cardseries";
import CardHalfFull from "./cardhalffull";

import computeFT from "@/lib/analysisEngine/computeFT";
import computeHT from "@/lib/analysisEngine/computeHT";
import compute2H from "@/lib/analysisEngine/compute2H";
import computeStreaks from "@/lib/analysisEngine/computeStreaks";

export default function ProbabilitiesView({ fixtures }) {
  const [filter, setFilter] = useState("FT");

  const engines = {
    FT: computeFT,
    HT: computeHT,
    "2H": compute2H,
  };

  const computeEngine = engines[filter];
  const baseStats = computeEngine(fixtures ?? []);
  const streakStats = computeStreaks(fixtures ?? []);

  const stats = {
    ...baseStats,
    streaks: streakStats,
  };
  const streaks = streakStats;

  console.log("➡️ FIXTURES RECEIVED BY ProbabilitiesView:", fixtures?.length);
  console.log("➡️ CURRENT FILTER:", filter);
  console.log("➡️ BASE STATS:", baseStats);
  console.log("➡️ STREAK STATS:", streakStats);
  console.log("➡️ FINAL MERGED STATS:", stats);
  console.log("➡️ STATS SENT TO CARDS:", stats);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setFilter("FT")}
          className={`px-4 py-2 rounded-md ${
            filter === "FT" ? "bg-green-600 text-white" : "bg-white/10"
          }`}
        >
          Full Game
        </button>

        <button
          onClick={() => setFilter("HT")}
          className={`px-4 py-2 rounded-md ${
            filter === "HT" ? "bg-green-600 text-white" : "bg-white/10"
          }`}
        >
          1st Half
        </button>

        <button
          onClick={() => setFilter("2H")}
          className={`px-4 py-2 rounded-md ${
            filter === "2H" ? "bg-green-600 text-white" : "bg-white/10"
          }`}
        >
          2nd Half
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CardResult data={stats} streaks={streaks} />
        <CardOverUnder data={stats} streaks={streaks} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <CardGoals data={stats} streaks={streaks} />
        <CardCorners data={stats} streaks={streaks} />
        <CardCards data={stats} streaks={streaks} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <CardSeries data={stats} streaks={streaks} />
        <CardHalfFull data={stats} streaks={streaks} />
      </div>

      <div className="mt-6 p-4 rounded-lg bg-white/10 text-white text-sm">
        Mode sélectionné : {filter}
        <br />
        Matchs utilisés : {fixtures?.length ?? 0}
      </div>
    </div>
  );
}
