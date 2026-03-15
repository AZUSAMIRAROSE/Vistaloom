import { Link, useLocation } from "wouter";
import { ShoppingCart, Package, LogOut, User, Shield, ClipboardList, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Customer, CartItem } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  const { data: user } = useQuery<Customer | null>({
    queryKey: ["/api/auth/me"],
  });

  const { data: cartItems = [] } = useQuery<CartItem[]>({
    queryKey: ["/api/cart"],
    enabled: !!user,
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout"),
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.setQueryData(["/api/cart"], []);
      toast({ title: "Logged out successfully" });
      navigate("/");
    },
  });

  const navLinks = [
    { href: "/", label: "Shop", icon: Home },
    ...(user ? [
      { href: "/cart", label: "Cart", icon: ShoppingCart, badge: cartItems.length || undefined },
      { href: "/orders", label: "My Orders", icon: ClipboardList },
    ] : []),
    ...(user?.isAdmin ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer" data-testid="link-home">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <Package className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg tracking-tight">ShopBase</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon, badge }) => (
              <Link key={href} href={href}>
                <Button
                  variant={location === href ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-2 relative"
                  data-testid={`nav-${label.toLowerCase().replace(" ", "-")}`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {badge ? (
                    <Badge className="ml-1 h-5 min-w-5 text-xs px-1" data-testid="badge-cart-count">
                      {badge}
                    </Badge>
                  ) : null}
                </Button>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
                  <User className="w-3.5 h-3.5" />
                  <span data-testid="text-username">{user.name}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                  data-testid="button-logout"
                  className="gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button size="sm" data-testid="button-login-nav">Sign In</Button>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden border-t px-4 pb-2 pt-2 flex gap-1 overflow-x-auto">
          {navLinks.map(({ href, label, icon: Icon, badge }) => (
            <Link key={href} href={href}>
              <Button
                variant={location === href ? "secondary" : "ghost"}
                size="sm"
                className="gap-1.5 flex-shrink-0 relative"
                data-testid={`mobile-nav-${label.toLowerCase().replace(" ", "-")}`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {badge ? <Badge className="ml-0.5 h-4 min-w-4 text-xs px-1">{badge}</Badge> : null}
              </Button>
            </Link>
          ))}
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t bg-card py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-sm text-muted-foreground">
          <p>ShopBase &copy; {new Date().getFullYear()} &mdash; Your one-stop shop</p>
        </div>
      </footer>
    </div>
  );
}
