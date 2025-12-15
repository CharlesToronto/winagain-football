"use client";

import { Fragment, useMemo, useState } from "react";
import { Bet, BetResult } from "../utils/bankroll";

type Props = {
  bets: Bet[];
  onUpdate: (id: string, patch: Partial<Omit<Bet, "id">>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

export default function BetsTable({ bets, onUpdate, onDelete }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Bet>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const indexMap = useMemo(() => {
    const asc = [...bets].sort((a, b) => (a.bet_date > b.bet_date ? 1 : -1));
    const map = new Map<string, number>();
    asc.forEach((b, idx) => map.set(b.id, idx + 1));
    return map;
  }, [bets]);

  const startEdit = (bet: Bet) => {
    setEditingId(bet.id);
    setDraft({
      description: bet.description,
      bet_type: bet.bet_type,
      odds: bet.odds,
      stake: bet.stake,
      result: bet.result,
    });
  };

  const save = async (id: string) => {
    setBusyId(id);
    await onUpdate(id, draft);
    setBusyId(null);
    setEditingId(null);
  };

  const cancel = () => {
    setEditingId(null);
    setDraft({});
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-white">
      <h3 className="font-semibold text-lg mb-3">Historique des paris</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-white/70">
            <tr className="text-left">
              <th className="py-2 pr-3">#</th>
              <th className="py-2 pr-3">Date</th>
              <th className="py-2 pr-3">Description</th>
              <th className="py-2 pr-3">Type</th>
              <th className="py-2 pr-3">Format</th>
              <th className="py-2 pr-3">Cote</th>
              <th className="py-2 pr-3">Mise</th>
              <th className="py-2 pr-3">Résultat</th>
              <th className="py-2 pr-3">Profit</th>
              <th className="py-2 pr-3">Bankroll</th>
              <th className="py-2 pr-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {bets.map((bet) => {
              const isEditing = editingId === bet.id;
              return (
                <Fragment key={bet.id}>
                <tr className="align-middle">
                  <td className="py-2 pr-3 whitespace-nowrap text-white/80">
                    <div className="flex flex-col leading-tight">
                      <span className="font-semibold text-xs">{bet.id.slice(0, 8)}</span>
                      <span className="text-[10px] text-white/60">#{indexMap.get(bet.id) ?? "-"}</span>
                    </div>
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap text-white/80">
                    {new Date(bet.bet_date).toLocaleDateString()}
                  </td>
                  <td className="py-2 pr-3">
                    {isEditing ? (
                      <input
                        value={draft.description ?? ""}
                        onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                        className="bg-white/10 border border-white/20 rounded px-2 py-1 w-full"
                      />
                    ) : (
                      bet.description
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    {isEditing ? (
                      <input
                        value={draft.bet_type ?? ""}
                        onChange={(e) => setDraft((d) => ({ ...d, bet_type: e.target.value }))}
                        className="bg-white/10 border border-white/20 rounded px-2 py-1 w-full"
                      />
                    ) : (
                      bet.bet_type
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    <span className="text-xs px-2 py-1 rounded bg-white/10 border border-white/10">
                      {bet.bet_kind === "combined" ? "Combiné" : "Simple"}
                    </span>
                  </td>
                  <td className="py-2 pr-3">
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        value={draft.odds ?? bet.odds}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, odds: parseFloat(e.target.value) }))
                        }
                        className="bg-white/10 border border-white/20 rounded px-2 py-1 w-20"
                      />
                    ) : (
                      bet.odds.toFixed(2)
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        value={draft.stake ?? bet.stake}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, stake: parseFloat(e.target.value) }))
                        }
                        className="bg-white/10 border border-white/20 rounded px-2 py-1 w-24"
                      />
                    ) : (
                      `${bet.stake.toFixed(2)} €`
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    {isEditing ? (
                      <select
                        value={draft.result ?? bet.result}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, result: e.target.value as BetResult }))
                        }
                        className="bg-white/10 border border-white/20 rounded px-2 py-1"
                      >
                        <option value="pending">En attente</option>
                        <option value="win">Gagné</option>
                        <option value="loss">Perdu</option>
                        <option value="void">Void</option>
                      </select>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{labelResult(bet.result)}</span>
                        <select
                          value={bet.result}
                          onChange={(e) =>
                            void onUpdate(bet.id, { result: e.target.value as BetResult })
                          }
                          className="bg-[#1f0f3a] border border-white/20 rounded px-2 py-1 text-xs"
                        >
                          <option value="pending">En attente</option>
                          <option value="win">Gagné</option>
                          <option value="loss">Perdu</option>
                          <option value="void">Void</option>
                        </select>
                      </div>
                    )}
                  </td>
                  <td className="py-2 pr-3">{bet.profit.toFixed(2)} €</td>
                  <td className="py-2 pr-3">{bet.bankroll_after.toFixed(2)} €</td>
                  <td className="py-2 pr-3 text-right whitespace-nowrap">
                    {isEditing ? (
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => save(bet.id)}
                          disabled={busyId === bet.id}
                          className="text-green-400 hover:underline disabled:opacity-70"
                        >
                          Sauver
                        </button>
                        <button
                          onClick={cancel}
                          className="text-white/70 hover:underline"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 justify-end">
                        <button
                          onClick={() => startEdit(bet)}
                          className="text-white/80 hover:underline"
                        >
                          Éditer
                        </button>
                        <button
                          onClick={() => onDelete(bet.id)}
                          className="text-red-400 hover:underline"
                        >
                          Supprimer
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
                {bet.bet_kind === "combined" && bet.selections?.length ? (
                  <tr className="bg-white/5">
                    <td colSpan={9} className="py-2 pr-3 text-xs text-white/70">
                      Sélections :{" "}
                      {bet.selections
                        .map((sel) => `${sel.description} (x${sel.odds})`)
                        .join(" · ")}
                    </td>
                  </tr>
                ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function labelResult(result: BetResult) {
  switch (result) {
    case "win":
      return "Gagné";
    case "loss":
      return "Perdu";
    case "pending":
      return "En attente";
    case "void":
    default:
      return "Void";
  }
}
