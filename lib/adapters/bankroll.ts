import { supabase } from "@/lib/supabase/client";
import { Bet } from "@/app/bankroll/utils/bankroll";

const ANON_USER_ID = "00000000-0000-0000-0000-000000000000";

async function getUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? ANON_USER_ID;
}

export async function fetchBankrollBets(): Promise<Bet[]> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("bankroll_bets")
    .select("*")
    .eq("user_id", userId)
    .order("bet_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as Bet[];
}

export async function upsertBankrollBets(bets: Bet[]): Promise<void> {
  const userId = await getUserId();
  const payload = bets.map((bet) => ({
    ...bet,
    user_id: bet.user_id ?? userId,
  }));
  const { error } = await supabase.from("bankroll_bets").upsert(payload);
  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteBankrollBet(id: string): Promise<void> {
  const { error } = await supabase.from("bankroll_bets").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
}
