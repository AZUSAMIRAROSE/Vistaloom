import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Trash2, ArrowRight, Package } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CartItem, Customer } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";

export default function CartPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: user } = useQuery<Customer | null>({ queryKey: ["/api/auth/me"] });
  const { data: cartItems = [], isLoading } = useQuery<CartItem[]>({
    queryKey: ["/api/cart"],
    enabled: !!user,
  });

  const removeMutation = useMutation({
    mutationFn: (productId: number) => apiRequest("DELETE", `/api/cart/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({ title: "Item removed from cart" });
    },
    onError: (err: Error) => toast({ title: err.message, variant: "destructive" }),
  });

  if (!user) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <ShoppingCart className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="font-semibold text-lg">Sign in to view your cart</p>
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const total = cartItems.reduce((sum, item) => sum + parseFloat(item.product.price), 0);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <ShoppingCart className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Your Cart</h1>
          {cartItems.length > 0 && (
            <span className="text-muted-foreground text-sm">({cartItems.length} item{cartItems.length !== 1 ? "s" : ""})</span>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="p-4 flex gap-4">
                  <Skeleton className="w-20 h-20 rounded-md flex-shrink-0" />
                  <div className="flex-1 flex flex-col gap-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-lg">Your cart is empty</p>
              <p className="text-muted-foreground text-sm mt-1">Add some products to get started</p>
            </div>
            <Link href="/">
              <Button>Browse Products</Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Cart items */}
            <div className="flex-1 flex flex-col gap-3">
              {cartItems.map(item => (
                <Card key={item.id} data-testid={`card-cart-item-${item.productId}`}>
                  <CardContent className="p-4 flex gap-4 items-start">
                    <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                      <img
                        src={item.product.image.startsWith("http") ? item.product.image : `/uploads/products/${item.product.image}`}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/80x80?text=Item"; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm line-clamp-2" data-testid={`text-cart-item-name-${item.productId}`}>
                        {item.product.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.product.category}</p>
                      <p className="text-lg font-bold text-primary mt-2" data-testid={`text-cart-item-price-${item.productId}`}>
                        ${parseFloat(item.product.price).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMutation.mutate(item.productId)}
                      disabled={removeMutation.isPending}
                      data-testid={`button-remove-cart-${item.productId}`}
                      className="flex-shrink-0 text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Summary */}
            <div className="lg:w-72">
              <Card>
                <CardContent className="p-5 flex flex-col gap-3">
                  <h2 className="font-semibold text-base">Order Summary</h2>
                  <Separator />
                  {cartItems.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground truncate mr-2 flex-1">{item.product.name}</span>
                      <span className="flex-shrink-0">${parseFloat(item.product.price).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span data-testid="text-cart-total">${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                </CardContent>
                <CardFooter className="p-5 pt-0">
                  <Button
                    className="w-full gap-2"
                    onClick={() => navigate("/checkout")}
                    data-testid="button-proceed-checkout"
                  >
                    Proceed to Checkout
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
