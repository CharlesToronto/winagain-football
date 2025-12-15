"use client";

import StatsCards from "./components/StatsCards";
import BankrollChart from "./components/BankrollChart";
import AddBetForm from "./components/AddBetForm";
import BetsTable from "./components/BetsTable";
import { useBankroll } from "./hooks/useBankroll";

export default function BankrollPage() {
  const {
    betsAsc,
    betsDesc,
    stats,
    startingCapital,
    setStartingCapitalState,
    updateStartingCapital,
    loading,
    error,
    addBet,
    updateBet,
    deleteBet,
  } = useBankroll();

  return (
    <div className="min-h-screen p-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Bankroll</h1>
        {loading && <span className="text-sm text-white/70">Chargement...</span>}
      </div>

      <div className="space-y-6">
        <div className="p-4 rounded-xl bg-white/10 border border-white/10 text-white flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm text-white/70">Capital de base</p>
            <p className="text-2xl font-semibold">{startingCapital.toFixed(2)} CAD</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              value={startingCapital}
              onChange={(e) => setStartingCapitalState(parseFloat(e.target.value))}
              className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white w-32"
            />
            <button
              onClick={async () => {
                await updateStartingCapital(startingCapital);
              }}
              className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-sm font-semibold"
            >
              Mettre à jour
            </button>
          </div>
        </div>

        <StatsCards
          bankroll={stats.bankrollCurrent}
          totalProfit={stats.totalProfit}
          roi={stats.roi}
          count={stats.count}
          winrate={stats.winrate}
        />

        <BankrollChart bets={betsAsc} />

        <AddBetForm onSubmit={addBet} />

        {error ? (
          <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/40 text-red-100">
            {error}
          </div>
        ) : null}

        <BetsTable bets={betsDesc} onUpdate={updateBet} onDelete={deleteBet} />
      </div>
    </div>
  );
}
