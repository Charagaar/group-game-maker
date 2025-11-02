import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Stats {
  totalVisitors: number;
  completedWon: number;
  completedLost: number;
  notCompleted: number;
}

export default function Statistics() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalVisitors: 0,
    completedWon: 0,
    completedLost: 0,
    notCompleted: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated and has admin role
    checkAuthAndLoadData();
  }, [navigate]);

  const checkAuthAndLoadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    // Check if user has admin role
    const { data: roles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'admin')
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
      const { data, error } = await supabase
        .from("game_sessions")
        .select("*");

      if (error) throw error;

      const totalVisitors = data.length;
      const completedWon = data.filter(s => s.game_won === true).length;
      const completedLost = data.filter(s => s.game_won === false && s.completed_at !== null).length;
      const notCompleted = data.filter(s => s.completed_at === null).length;

      setStats({
        totalVisitors,
        completedWon,
        completedLost,
        notCompleted,
      });
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
            Overview of player activity and game outcomes
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{stats.totalVisitors}</CardTitle>
              <CardDescription>Total Visitors</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Number of people who started the game
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{stats.completedWon}</CardTitle>
              <CardDescription>Games Won</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Completed all categories successfully
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{stats.completedLost}</CardTitle>
              <CardDescription>Games Lost</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Lost all lives but completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{stats.notCompleted}</CardTitle>
              <CardDescription>Games Not Completed</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Started but didn't finish
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Win Rate:</span>
                <span className="text-sm font-semibold">
                  {stats.totalVisitors > 0
                    ? ((stats.completedWon / stats.totalVisitors) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Completion Rate (Win or Loss):</span>
                <span className="text-sm font-semibold">
                  {stats.totalVisitors > 0
                    ? (((stats.completedWon + stats.completedLost) / stats.totalVisitors) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
