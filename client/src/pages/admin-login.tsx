import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, User, Shield, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface LoginForm {
  username: string;
  password: string;
}

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [form, setForm] = useState<LoginForm>({ username: "", password: "" });
  const [showSetup, setShowSetup] = useState(false);
  const [setupForm, setSetupForm] = useState({ username: "", email: "", password: "" });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      // Store token in localStorage
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("admin_user", JSON.stringify(data.user));
      
      // Force page reload to update auth state
      window.location.href = "/admin";
    },
    onError: (error: any) => {
      console.error("Login failed:", error);
    }
  });

  const setupMutation = useMutation({
    mutationFn: async (data: typeof setupForm) => {
      const response = await apiRequest("POST", "/api/auth/setup", data);
      return response.json();
    },
    onSuccess: () => {
      setShowSetup(false);
      // Auto-login after setup
      loginMutation.mutate({ username: setupForm.username, password: setupForm.password });
    },
    onError: (error: any) => {
      if (error.response?.status === 409) {
        setShowSetup(false);
      }
    }
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(form);
  };

  const handleSetup = (e: React.FormEvent) => {
    e.preventDefault();
    setupMutation.mutate(setupForm);
  };

  const trySetup = () => {
    // Try to access setup endpoint to see if it's available
    apiRequest("POST", "/api/auth/setup", { test: true }).catch((error) => {
      if (error.message?.includes('409')) {
        // Setup not allowed, admin exists
        setShowSetup(false);
      } else {
        // Setup is available
        setShowSetup(true);
      }
    });
  };

  if (showSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle>Admin Setup</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create the initial administrator account
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetup} className="space-y-4">
              <div>
                <Label htmlFor="setup-username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="setup-username"
                    type="text"
                    value={setupForm.username}
                    onChange={(e) => setSetupForm(prev => ({ ...prev, username: e.target.value }))}
                    className="pl-10"
                    placeholder="admin"
                    required
                    minLength={3}
                    maxLength={50}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="setup-email">Email</Label>
                <Input
                  id="setup-email"
                  type="email"
                  value={setupForm.email}
                  onChange={(e) => setSetupForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="admin@tubebenderreviews.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="setup-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="setup-password"
                    type="password"
                    value={setupForm.password}
                    onChange={(e) => setSetupForm(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-10"
                    placeholder="Minimum 8 characters"
                    required
                    minLength={8}
                    maxLength={100}
                  />
                </div>
              </div>

              {setupMutation.error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {setupMutation.error.message.includes(':') 
                      ? setupMutation.error.message.split(':').slice(1).join(':').trim()
                      : "Setup failed. Please try again."}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={setupMutation.isPending}
              >
                {setupMutation.isPending ? "Creating Account..." : "Create Admin Account"}
              </Button>

              <Button 
                type="button" 
                variant="outline" 
                className="w-full"
                onClick={() => setShowSetup(false)}
              >
                Back to Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle>Admin Login</CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Sign in to access the admin panel
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm(prev => ({ ...prev, username: e.target.value }))}
                  className="pl-10"
                  placeholder="Enter your username"
                  required
                  minLength={3}
                  maxLength={50}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                  className="pl-10"
                  placeholder="Enter your password"
                  required
                  minLength={8}
                  maxLength={100}
                />
              </div>
            </div>

            {loginMutation.error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {loginMutation.error.message.includes(':') 
                    ? loginMutation.error.message.split(':').slice(1).join(':').trim()
                    : "Login failed. Please check your credentials."}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Signing In..." : "Sign In"}
            </Button>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full text-sm"
              onClick={trySetup}
            >
              First time? Set up admin account
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-500">
            <p>Secure login with rate limiting and account lockout protection</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}