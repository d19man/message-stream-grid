import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff, Shield, Mail, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [loginData, setLoginData] = useState({ email: "", password: "" });

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!loginData.email || !loginData.password) {
        throw new Error("Please fill in all fields");
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: loginData.email.trim(),
        password: loginData.password,
      });

      if (error) {
        // Handle specific auth errors
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Invalid email or password");
        }
        if (error.message.includes("Email not confirmed")) {
          throw new Error("Please check your email and confirm your account");
        }
        throw error;
      }

      toast({
        title: "Welcome back!",
        description: "Successfully signed in to your account",
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };


  const handleForgotPassword = async () => {
    if (!loginData.email) {
      setError("Please enter your email address first");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(loginData.email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast({
        title: "Password reset sent",
        description: "Check your email for password reset instructions",
      });
    } catch (error: any) {
      setError(error.message || "Failed to send password reset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">WhatsApp Manager</h1>
          <p className="text-muted-foreground mt-2">
            Sign in to manage your WhatsApp operations
          </p>
        </div>

        {/* Auth Form */}
        <Card className="shadow-elegant border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-center">Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="Enter your email"
                    value={loginData.email}
                    onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-10 pr-10"
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="link"
                  className="px-0 text-sm"
                  onClick={handleForgotPassword}
                  disabled={loading}
                >
                  Forgot password?
                </Button>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-primary hover:opacity-90"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">
                Secure access to WhatsApp Manager
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;