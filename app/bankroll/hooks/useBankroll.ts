"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  Bet,
  BetResult,
  INITIAL_BANKROLL,
  computeStats,
  recomputeSequence,
} from "../utils/bankroll";

const ANON_USER_ID = "00000000-0000-0000-0000-000000000000";

type BetInput = Omit<
  Bet,
  | "id"
  | "profit"
  | "bankroll_after"
  | "created_at"
  | "updated_at"
  | "user_id"
  | "odds"
  | "starting_capital"
> & { odds?: number };

export function useBankroll() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingCapital, setStartingCapital] = useState<number>(1000);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id ?? ANON_USER_ID;

    const { data, error } = await supabase
      .from("bankroll_bets")
      .select("*")
      .eq("user_id", userId)
      .order("bet_date", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const typed = (data || []) as Bet[];
    const base =
      typed.length > 0 ? typed[0].starting_capital ?? INITIAL_BANKROLL : INITIAL_BANKROLL;
    setStartingCapital(base);
    const recalculated = recomputeSequence(typed, base);
    setBets(recalculated);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const persistSequence = useCallback(async (updated: Bet[]) => {
    if (updated.length === 0) return;
    await supabase.from("bankroll_bets").upsert(
      updated.map((bet) => ({
        ...bet,
        starting_capital: bet.starting_capital ?? startingCapital,
        updated_at: new Date().toISOString(),
      }))
    );
  }, [startingCapital]);

  const addBet = useCallback(
    async (input: BetInput) => {
      setError(null);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userId = user?.id ?? ANON_USER_ID;

      const newBet: Bet = {
        id: crypto.randomUUID(),
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        bet_date: input.bet_date,
        ...input,
        odds: input.odds ?? 1,
        profit: 0,
        bankroll_after: 0,
        result: input.result ?? "pending",
        starting_capital: startingCapital,
      };

      const recalculated = recomputeSequence([...bets, newBet], startingCapital);
      setBets(recalculated);
      await supabase.from("bankroll_bets").upsert(recalculated);
    },
    [bets, startingCapital]
  );

  const updateStartingCapital = useCallback(
    async (value: number) => {
      setStartingCapital(value);
      if (!bets.length) return;
      const recalculated = recomputeSequence(
        bets.map((b) => ({ ...b, starting_capital: value })),
        value
      );
      setBets(recalculated);
      await persistSequence(recalculated);
    },
    [bets, persistSequence]
  );

  const updateBet = useCallback(
    async (id: string, patch: Partial<BetInput>) => {
      setError(null);
      const existing = bets.find((b) => b.id === id);
      if (!existing) return;
      const updatedBet: Bet = {
        ...existing,
        ...patch,
        bet_date: patch.bet_date ?? existing.bet_date,
        updated_at: new Date().toISOString(),
      };
      const recalculated = recomputeSequence(
        bets.map((b) => (b.id === id ? updatedBet : b)),
        startingCapital
      );
      setBets(recalculated);
      await supabase.from("bankroll_bets").upsert(recalculated);
    },
    [bets, startingCapital]
  );

  const deleteBet = useCallback(
    async (id: string) => {
      setError(null);
      await supabase.from("bankroll_bets").delete().eq("id", id);
      const recalculated = recomputeSequence(
        bets.filter((b) => b.id !== id),
        startingCapital
      );
      setBets(recalculated);
      await persistSequence(recalculated);
    },
    [bets, persistSequence, startingCapital]
  );

  const stats = useMemo(() => computeStats(bets, startingCapital), [bets, startingCapital]);
  const orderedDesc = useMemo(
    () => [...bets].sort((a, b) => (a.bet_date < b.bet_date ? 1 : -1)),
    [bets]
  );

  return {
    betsAsc: bets,
    betsDesc: orderedDesc,
    stats,
    startingCapital,
    setStartingCapitalState: setStartingCapital,
    updateStartingCapital,
    persistSequence,
    loading,
    error,
    addBet,
    updateBet,
    deleteBet,
    reload: load,
  };
}
