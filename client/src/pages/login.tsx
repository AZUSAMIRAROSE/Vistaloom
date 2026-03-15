import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Package } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "register">("login");

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", password: "" });

  const loginMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/login", loginForm),
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/me"], user);
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({ title: `Welcome back, ${user.name}!` });
      navigate("/");
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  const registerMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/register", registerForm),
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/me"], user);
      toast({ title: `Welcome, ${user.name}! Your account has been created.` });
      navigate("/");
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  return (
    <Layout>
      <div className="min-h-[calc(100vh-180px)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">ShopBase</h1>
            <p className="text-muted-foreground text-sm">
              {mode === "login" ? "Sign in to your account" : "Create a new account"}
            </p>
          </div>

          <Card className="w-full">
            <CardHeader>
              <div className="flex gap-1 p-1 bg-muted rounded-md">
                <button
                  onClick={() => setMode("login")}
                  className={`flex-1 text-sm font-medium py-1.5 px-3 rounded-sm transition-all ${
                    mode === "login" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid="button-tab-login"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setMode("register")}
                  className={`flex-1 text-sm font-medium py-1.5 px-3 rounded-sm transition-all ${
                    mode === "register" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid="button-tab-register"
                >
                  Create Account
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {mode === "login" ? (
                <form
                  onSubmit={e => { e.preventDefault(); loginMutation.mutate(); }}
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={loginForm.email}
                      onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                      required
                      data-testid="input-email"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                      required
                      data-testid="input-password"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                    data-testid="button-submit-login"
                  >
                    {loginMutation.isPending ? "Signing in..." : "Sign In"}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Demo admin: admin@shopbase.com / admin123
                  </p>
                </form>
              ) : (
                <form
                  onSubmit={e => { e.preventDefault(); registerMutation.mutate(); }}
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="reg-name">Full Name</Label>
                    <Input
                      id="reg-name"
                      type="text"
                      placeholder="John Doe"
                      value={registerForm.name}
                      onChange={e => setRegisterForm(f => ({ ...f, name: e.target.value }))}
                      required
                      data-testid="input-name"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="reg-email">Email</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="you@example.com"
                      value={registerForm.email}
                      onChange={e => setRegisterForm(f => ({ ...f, email: e.target.value }))}
                      required
                      data-testid="input-email-register"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="reg-password">Password</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerForm.password}
                      onChange={e => setRegisterForm(f => ({ ...f, password: e.target.value }))}
                      required
                      minLength={6}
                      data-testid="input-password-register"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={registerMutation.isPending}
                    data-testid="button-submit-register"
                  >
                    {registerMutation.isPending ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
