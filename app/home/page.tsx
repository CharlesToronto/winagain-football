import Card from "@/app/components/ui/Card";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createClient();

  // Fetch numbers
  const { count: fixturesToday } = await supabase
    .from("fixtures")
    .select("*", { count: "exact", head: true })
    .gte("date", new Date().toISOString().slice(0, 10))
    .lte("date", new Date().toISOString().slice(0, 10));

  const { count: leagues } = await supabase
    .from("competitions")
    .select("*", { count: "exact", head: true });

  const { count: teams } = await supabase
    .from("teams")
    .select("*", { count: "exact", head: true });

  const { count: teamStats } = await supabase
    .from("team_stats")
    .select("*", { count: "exact", head: true });

  const { count: odds } = await supabase
    .from("odds")
    .select("*", { count: "exact", head: true });

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

      <Card>
        <h2 className="text-lg font-semibold mb-1">Matches Today</h2>
        <p className="text-3xl font-bold">{fixturesToday || 0}</p>
        <p className="text-gray-500 text-sm">Total fixtures scheduled today</p>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-1">Active Leagues</h2>
        <p className="text-3xl font-bold">{leagues || 0}</p>
        <p className="text-gray-500 text-sm">Total competitions available</p>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-1">Teams Imported</h2>
        <p className="text-3xl font-bold">{teams || 0}</p>
        <p className="text-gray-500 text-sm">Teams from all leagues</p>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-1">Teams With Stats</h2>
        <p className="text-3xl font-bold">{teamStats || 0}</p>
        <p className="text-gray-500 text-sm">Teams having advanced stats</p>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-1">Odds Imported</h2>
        <p className="text-3xl font-bold">{odds || 0}</p>
        <p className="text-gray-500 text-sm">Fixtures with bookmaker info</p>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-2">Quick Actions</h2>
        <div className="flex flex-col gap-2">
          <a href="/leagues" className="text-blue-600 hover:underline">
            → View Leagues
          </a>
          <a href="/search" className="text-blue-600 hover:underline">
            → Search Matches
          </a>
          <a href="/teams" className="text-blue-600 hover:underline">
            → Team Statistics
          </a>
        </div>
      </Card>

    </div>
  );
}
