import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Bootstrap() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const createAdmin = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bootstrap-admin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create admin');
      }

      toast.success('Admin account created successfully!');
      toast.info('Email: unmapped.blr@gmail.com | Password: Unmap2025blr');
      
      setTimeout(() => {
        navigate('/auth');
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create admin account');
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
            Create the first admin account for your application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <p><strong>Email:</strong> unmapped.blr@gmail.com</p>
            <p><strong>Password:</strong> Unmap2025blr</p>
          </div>
          <Button 
            onClick={createAdmin} 
            className="w-full" 
            disabled={loading}
          >
            {loading ? "Creating Admin Account..." : "Create Admin Account"}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/auth')}
            className="w-full"
          >
            Go to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
