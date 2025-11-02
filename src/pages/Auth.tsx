import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function Auth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    // Check if already authenticated
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      // Check if user has admin role using has_role function (bypasses RLS)
      const { data: isAdmin, error: roleError } = await supabase
        .rpc('has_role', {
          _user_id: session.user.id,
          _role: 'admin'
        });
      
      if (roleError) {
        console.error('Role check error:', roleError);
        toast.error("Error checking admin access");
        await supabase.auth.signOut();
        return;
      }
      
      if (isAdmin) {
        navigate("/admin");
      } else {
        toast.error("Admin access required");
        await supabase.auth.signOut();
      }
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        // Provide more specific error messages
        if (error.message.includes('Email not confirmed')) {
          toast.error("Please check your email and confirm your account before signing in.");
        } else if (error.message.includes('Invalid login credentials')) {
          toast.error("Invalid email or password. Please try again.");
        } else {
          toast.error(error.message || "Failed to sign in");
        }
        return;
      }

      if (data.user) {
        // Check if user has admin role using has_role function (bypasses RLS)
        const { data: isAdmin, error: roleError } = await supabase
          .rpc('has_role', {
            _user_id: data.user.id,
            _role: 'admin'
          });

        if (roleError) {
          console.error('Role check error:', roleError);
          toast.error("Error checking admin access: " + roleError.message);
          await supabase.auth.signOut();
          return;
        }

        if (!isAdmin) {
          toast.error("Admin access required");
          await supabase.auth.signOut();
          return;
        }

        toast.success("Logged in successfully!");
        navigate("/admin");
      }
    } catch (error: any) {
      console.error('Unexpected error:', error);
      toast.error(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`
        }
      });

      if (error) {
        console.error('Sign up error:', error);
        // Provide more specific error messages
        if (error.message.includes('already registered')) {
          toast.error("An account with this email already exists. Please sign in instead.");
        } else {
          toast.error(error.message || "Failed to sign up");
        }
        return;
      }

      if (data.user) {
        toast.success("Account created! Please check your email to confirm your account.");
      } else {
        toast.success("Please check your email to confirm your account.");
      }
      setIsSignUp(false);
    } catch (error: any) {
      console.error('Unexpected error:', error);
      toast.error(error.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isSignUp ? "Admin Sign Up" : "Admin Login"}</CardTitle>
          <CardDescription>
            {isSignUp 
              ? "Create an admin account (Note: Admin role must be assigned separately)"
              : "Sign in with your admin credentials"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                minLength={6}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button type="submit" className="w-full text-xs sm:text-sm px-3 sm:px-4" disabled={loading}>
                {loading ? "Loading..." : (isSignUp ? "Sign Up" : "Login")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSignUp(!isSignUp)}
                className="w-full text-xs sm:text-sm px-3 sm:px-4"
              >
                <span className="truncate">
                  {isSignUp ? "Already have an account? Login" : "Need an account? Sign Up"}
                </span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate("/")}
                className="w-full text-xs sm:text-sm px-3 sm:px-4"
              >
                <span className="truncate">Back to Game</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
