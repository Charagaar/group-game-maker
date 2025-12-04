import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Stats {
  totalSessions: number;
  wins: number;
  losses: number;
  incomplete: number;
  completionRate: number;
  winRate: number;
}

interface ClientMetric {
  client_id: string | null;
  sessions: number | null;
  wins: number | null;
  losses: number | null;
  incomplete: number | null;
  win_rate: number | null;
  first_seen: string | null;
  last_seen: string | null;
  avg_lives_lost: number | null;
  avg_categories_solved: number | null;
}

interface EngagementStats {
  returningUsers: number;
  avgSessionsPerClient: number;
  medianSessionsPerClient: number;
  active7d: number;
  active30d: number;
  sessionBuckets: { label: string; count: number }[];
}

interface PuzzleMetric {
  puzzleId: string;
  sessions: number;
  wins: number;
  losses: number;
  incomplete: number;
  winRate: number;
  avgLivesLost: number;
}

interface DailyMetric {
  day: string | null;
  sessions: number | null;
  wins: number | null;
  losses: number | null;
  incomplete: number | null;
  unique_clients: number | null;
  avg_lives_lost: number | null;
  avg_categories_solved: number | null;
}

type SessionRow = {
  puzzle_id: string | null;
  game_won: boolean | null;
  completed_at: string | null;
  lives_lost: number | null;
};

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;
const formatDate = (value: string | null) => (value ? new Date(value).toLocaleDateString() : "—");
const toNumber = (value: number | null | undefined) => value ?? 0;
const truncateClientId = (id: string | null) => (id ? `${id.slice(0, 4)}…${id.slice(-4)}` : "Unknown");

export default function Statistics() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalSessions: 0,
    wins: 0,
    losses: 0,
    incomplete: 0,
    completionRate: 0,
    winRate: 0,
  });
  const [clientMetrics, setClientMetrics] = useState<ClientMetric[]>([]);
  const [engagement, setEngagement] = useState<EngagementStats>({
    returningUsers: 0,
    avgSessionsPerClient: 0,
    medianSessionsPerClient: 0,
    active7d: 0,
    active30d: 0,
    sessionBuckets: [],
  });
  const [puzzleMetrics, setPuzzleMetrics] = useState<PuzzleMetric[]>([]);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthAndLoadData();
  }, [navigate]);

  const computeGlobalStats = (dailyMetrics: DailyMetric[]): Stats => {
    const totalSessions = dailyMetrics.reduce((sum, d) => sum + toNumber(d.sessions), 0);
    const wins = dailyMetrics.reduce((sum, d) => sum + toNumber(d.wins), 0);
    const losses = dailyMetrics.reduce((sum, d) => sum + toNumber(d.losses), 0);
    const incomplete = dailyMetrics.reduce((sum, d) => sum + toNumber(d.incomplete), 0);
    const completionRate = totalSessions > 0 ? (wins + losses) / totalSessions : 0;
    const winRate = totalSessions > 0 ? wins / totalSessions : 0;

    return { totalSessions, wins, losses, incomplete, completionRate, winRate };
  };

  const computeEngagement = (metrics: ClientMetric[]): EngagementStats => {
    if (!metrics.length) {
      return {
        returningUsers: 0,
        avgSessionsPerClient: 0,
        medianSessionsPerClient: 0,
        active7d: 0,
        active30d: 0,
        sessionBuckets: [],
      };
    }

    const cleaned = metrics.filter((m) => m.client_id);
    const sessionCounts = cleaned.map((m) => toNumber(m.sessions)).sort((a, b) => a - b);
    const total = sessionCounts.reduce((sum, val) => sum + val, 0);
    const avgSessionsPerClient = sessionCounts.length ? total / sessionCounts.length : 0;
    const medianSessionsPerClient =
      sessionCounts.length % 2 === 1
        ? sessionCounts[(sessionCounts.length - 1) / 2]
        : sessionCounts.length
        ? (sessionCounts[sessionCounts.length / 2 - 1] + sessionCounts[sessionCounts.length / 2]) / 2
        : 0;

    const now = Date.now();
    const daysToMs = (days: number) => days * 24 * 60 * 60 * 1000;
    const active7d = cleaned.filter(
      (m) => m.last_seen && now - new Date(m.last_seen).getTime() <= daysToMs(7)
    ).length;
    const active30d = cleaned.filter(
      (m) => m.last_seen && now - new Date(m.last_seen).getTime() <= daysToMs(30)
    ).length;
    const returningUsers = cleaned.filter((m) => toNumber(m.sessions) > 1).length;

    const sessionBuckets = [
      { label: "1 session", count: cleaned.filter((m) => toNumber(m.sessions) === 1).length },
      { label: "2-3", count: cleaned.filter((m) => toNumber(m.sessions) >= 2 && toNumber(m.sessions) <= 3).length },
      { label: "4-5", count: cleaned.filter((m) => toNumber(m.sessions) >= 4 && toNumber(m.sessions) <= 5).length },
      { label: "6+", count: cleaned.filter((m) => toNumber(m.sessions) >= 6).length },
    ];

    return {
      returningUsers,
      avgSessionsPerClient,
      medianSessionsPerClient,
      active7d,
      active30d,
      sessionBuckets,
    };
  };

  const computePuzzleMetrics = (sessions: SessionRow[]): PuzzleMetric[] => {
    const map = new Map<
      string,
      { sessions: number; wins: number; losses: number; incomplete: number; livesLostTotal: number }
    >();

    sessions.forEach((session) => {
      if (!session.puzzle_id) return;
      if (!map.has(session.puzzle_id)) {
        map.set(session.puzzle_id, { sessions: 0, wins: 0, losses: 0, incomplete: 0, livesLostTotal: 0 });
      }
      const entry = map.get(session.puzzle_id)!;
      entry.sessions += 1;
      entry.livesLostTotal += session.lives_lost ?? 0;
      if (session.completed_at === null) {
        entry.incomplete += 1;
      } else if (session.game_won) {
        entry.wins += 1;
      } else {
        entry.losses += 1;
      }
    });

    return Array.from(map.entries())
      .map(([puzzleId, data]) => ({
        puzzleId,
        sessions: data.sessions,
        wins: data.wins,
        losses: data.losses,
        incomplete: data.incomplete,
        winRate: data.sessions > 0 ? data.wins / data.sessions : 0,
        avgLivesLost: data.sessions > 0 ? data.livesLostTotal / data.sessions : 0,
      }))
      .sort((a, b) => b.sessions - a.sessions);
  };

  const checkAuthAndLoadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roles, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roles) {
      toast.error("Admin access required");
      await supabase.auth.signOut();
      navigate("/auth");
      return;
    }

    loadStats();
  };

  const loadStats = async () => {
    try {
      const [
        { data: sessions, error: sessionsError },
        { data: clientView, error: clientError },
        { data: dailyView, error: dailyError },
      ] = await Promise.all([
        supabase.from("game_sessions").select("puzzle_id, game_won, completed_at, lives_lost"),
        supabase.from("game_metrics_by_client").select("*"),
        supabase.from("game_metrics_daily").select("*"),
      ]);

      if (sessionsError) throw sessionsError;
      if (clientError) throw clientError;
      if (dailyError) throw dailyError;

      const sessionRows = (sessions as SessionRow[]) ?? [];
      const dailyRows = (dailyView as DailyMetric[]) ?? [];
      setStats(computeGlobalStats(dailyRows));
      const clientRows = (clientView as ClientMetric[]) ?? [];
      setClientMetrics(clientRows);
      setEngagement(computeEngagement(clientRows));
      setPuzzleMetrics(computePuzzleMetrics(sessionRows));
      setDailyMetrics(dailyRows);
    } catch (error) {
      toast.error("Failed to load statistics");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading statistics...</p>
      </div>
    );
  }

  const topClients = [...clientMetrics]
    .filter((c) => c.client_id)
    .sort((a, b) => toNumber(b.win_rate) - toNumber(a.win_rate))
    .slice(0, 5);
  const bottomClients = [...clientMetrics]
    .filter((c) => c.client_id)
    .sort((a, b) => toNumber(a.win_rate) - toNumber(b.win_rate))
    .slice(0, 5);

  return (
    <div className="container mx-auto p-4 sm:p-8 min-h-screen">
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate("/admin")}
          className="text-xs sm:text-sm px-3 sm:px-4"
        >
          <ArrowLeft className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
          <span className="truncate">Back to Admin</span>
        </Button>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Game Statistics</h1>
          <p className="text-muted-foreground">
            Overview of play sessions, outcomes, and engagement
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{stats.totalSessions}</CardTitle>
              <CardDescription>Total Sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Games started across all clients
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{stats.wins}</CardTitle>
              <CardDescription>Games Won</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Completed with all categories solved
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{stats.losses}</CardTitle>
              <CardDescription>Games Lost</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Completed after lives ran out
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{stats.incomplete}</CardTitle>
              <CardDescription>In Progress</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Sessions started but not finished
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Win Rate</CardDescription>
              <CardTitle className="text-3xl">{formatPercent(stats.winRate)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {stats.wins} wins out of {stats.totalSessions} sessions
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Completion Rate</CardDescription>
              <CardTitle className="text-3xl">{formatPercent(stats.completionRate)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Includes both wins and losses
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Tracked Clients</CardDescription>
              <CardTitle className="text-3xl">{clientMetrics.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Unique client_ids sending session data
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Engagement</CardTitle>
            <CardDescription>Repeat usage and activity recency</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Returning Users</p>
                <p className="text-2xl font-semibold">{engagement.returningUsers}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Sessions / Client</p>
                <p className="text-2xl font-semibold">{engagement.avgSessionsPerClient.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Median Sessions / Client</p>
                <p className="text-2xl font-semibold">{engagement.medianSessionsPerClient.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active (7d / 30d)</p>
                <p className="text-2xl font-semibold">
                  {engagement.active7d} / {engagement.active30d}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Sessions per client</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {engagement.sessionBuckets.map((bucket) => (
                  <div key={bucket.label} className="rounded-lg border bg-card px-3 py-2">
                    <p className="text-xs text-muted-foreground">{bucket.label}</p>
                    <p className="text-lg font-semibold">{bucket.count}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Per-Client Metrics</CardTitle>
            <CardDescription>Sessions, outcomes, and recency per client_id</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="py-2 pr-2 font-medium">Client</th>
                  <th className="py-2 pr-2 font-medium">Sessions</th>
                  <th className="py-2 pr-2 font-medium">Wins</th>
                  <th className="py-2 pr-2 font-medium">Losses</th>
                  <th className="py-2 pr-2 font-medium">Incomplete</th>
                  <th className="py-2 pr-2 font-medium">Win Rate</th>
                  <th className="py-2 pr-2 font-medium">Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {clientMetrics.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-muted-foreground">
                      No client data yet.
                    </td>
                  </tr>
                )}
                {clientMetrics
                  .filter((c) => c.client_id)
                  .sort((a, b) => toNumber(b.sessions) - toNumber(a.sessions))
                  .map((client) => (
                    <tr key={client.client_id as string} className="border-t">
                      <td className="py-2 pr-2 font-medium">{truncateClientId(client.client_id)}</td>
                      <td className="py-2 pr-2">{toNumber(client.sessions)}</td>
                      <td className="py-2 pr-2">{toNumber(client.wins)}</td>
                      <td className="py-2 pr-2">{toNumber(client.losses)}</td>
                      <td className="py-2 pr-2">{toNumber(client.incomplete)}</td>
                      <td className="py-2 pr-2">{formatPercent(toNumber(client.win_rate))}</td>
                      <td className="py-2 pr-2">{formatDate(client.last_seen)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top Win Rates</CardTitle>
              <CardDescription>Highest win rates among tracked clients</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {topClients.length === 0 && (
                <p className="text-sm text-muted-foreground">No data yet.</p>
              )}
              {topClients.map((client) => (
                <div key={client.client_id as string} className="flex items-center justify-between border-b last:border-b-0 pb-2 last:pb-0">
                  <span className="font-medium">{truncateClientId(client.client_id)}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatPercent(toNumber(client.win_rate))} · {toNumber(client.sessions)} sessions
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lowest Win Rates</CardTitle>
              <CardDescription>Areas to improve difficulty or onboarding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {bottomClients.length === 0 && (
                <p className="text-sm text-muted-foreground">No data yet.</p>
              )}
              {bottomClients.map((client) => (
                <div key={client.client_id as string} className="flex items-center justify-between border-b last:border-b-0 pb-2 last:pb-0">
                  <span className="font-medium">{truncateClientId(client.client_id)}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatPercent(toNumber(client.win_rate))} · {toNumber(client.sessions)} sessions
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {puzzleMetrics.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Puzzle Performance</CardTitle>
              <CardDescription>Win/loss by puzzle fingerprint</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-2 font-medium">Puzzle</th>
                    <th className="py-2 pr-2 font-medium">Sessions</th>
                    <th className="py-2 pr-2 font-medium">Wins</th>
                    <th className="py-2 pr-2 font-medium">Losses</th>
                    <th className="py-2 pr-2 font-medium">Incomplete</th>
                    <th className="py-2 pr-2 font-medium">Win Rate</th>
                    <th className="py-2 pr-2 font-medium">Avg Lives Lost</th>
                  </tr>
                </thead>
                <tbody>
                  {puzzleMetrics.map((puzzle) => (
                    <tr key={puzzle.puzzleId} className="border-t">
                      <td className="py-2 pr-2 font-medium">{puzzle.puzzleId}</td>
                      <td className="py-2 pr-2">{puzzle.sessions}</td>
                      <td className="py-2 pr-2">{puzzle.wins}</td>
                      <td className="py-2 pr-2">{puzzle.losses}</td>
                      <td className="py-2 pr-2">{puzzle.incomplete}</td>
                      <td className="py-2 pr-2">{formatPercent(puzzle.winRate)}</td>
                      <td className="py-2 pr-2">{puzzle.avgLivesLost.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {dailyMetrics.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Daily Activity</CardTitle>
              <CardDescription>Sessions and outcomes by day</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-2 font-medium">Day</th>
                    <th className="py-2 pr-2 font-medium">Sessions</th>
                    <th className="py-2 pr-2 font-medium">Wins</th>
                    <th className="py-2 pr-2 font-medium">Losses</th>
                    <th className="py-2 pr-2 font-medium">Incomplete</th>
                    <th className="py-2 pr-2 font-medium">Unique Clients</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyMetrics.map((day, index) => (
                    <tr key={day.day ?? `day-${index}`} className="border-t">
                      <td className="py-2 pr-2 font-medium">{day.day ?? "Unknown"}</td>
                      <td className="py-2 pr-2">{toNumber(day.sessions)}</td>
                      <td className="py-2 pr-2">{toNumber(day.wins)}</td>
                      <td className="py-2 pr-2">{toNumber(day.losses)}</td>
                      <td className="py-2 pr-2">{toNumber(day.incomplete)}</td>
                      <td className="py-2 pr-2">{toNumber(day.unique_clients)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
