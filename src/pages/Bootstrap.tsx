import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function Bootstrap() {
  const [loading, setLoading] = useState(false);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      setCurrentEmail(data.session?.user.email ?? null);
    };

    loadSession();
  }, []);

  const grantCurrentUserAdmin = async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const email = session?.user?.email ?? null;
      if (!session || !email) {
        toast.error("Please sign in first, then return here to grant admin access.");
        navigate("/auth");
        return;
      }

      const { error } = await supabase.rpc("grant_admin_to_user", {
        _email: email,
      });
      if (error) {
        throw error;
      }

      toast.success("Admin role granted. Redirecting to admin panel...");
      setTimeout(() => {
        navigate("/admin");
      }, 2000);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to grant admin role";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Bootstrap Admin</CardTitle>
          <CardDescription>
            Grant admin role to the currently signed-in account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>1. Sign up or log in at /auth.</p>
            <p>2. Return here and click the button below.</p>
            <p>
              Signed in as: <strong>{currentEmail ?? "No active session"}</strong>
            </p>
          </div>
          <Button
            onClick={grantCurrentUserAdmin}
            className="w-full"
            disabled={loading}
          >
            {loading ? "Granting Admin Role..." : "Grant Admin To Current User"}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/auth")}
            className="w-full"
          >
            Go to Login / Sign Up
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
