import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, CreditCard, MapPin, ShoppingBag } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CartItem, Customer } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";

export default function Checkout() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [success, setSuccess] = useState(false);

  const { data: user } = useQuery<Customer | null>({ queryKey: ["/api/auth/me"] });
  const { data: cartItems = [] } = useQuery<CartItem[]>({
    queryKey: ["/api/cart"],
    enabled: !!user,
  });

  const orderMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/orders", { address, paymentMethod }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setSuccess(true);
    },
    onError: (err: Error) => toast({ title: err.message, variant: "destructive" }),
  });

  const total = cartItems.reduce((sum, item) => sum + parseFloat(item.product.price), 0);

  if (!user) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center flex flex-col items-center gap-4">
          <p className="font-semibold text-lg">Sign in to checkout</p>
          <Link href="/login"><Button>Sign In</Button></Link>
        </div>
      </Layout>
    );
  }

  if (success) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Order Placed!</h2>
            <p className="text-muted-foreground mt-2">
              Your order has been successfully placed and is being processed.
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => navigate("/orders")} data-testid="button-track-orders">Track My Orders</Button>
            <Button variant="outline" onClick={() => navigate("/")} data-testid="button-continue-shopping">Continue Shopping</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <ShoppingBag className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Checkout</h1>
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center gap-4">
            <p className="font-semibold text-lg">Your cart is empty</p>
            <Link href="/">
              <Button>Browse Products</Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Form */}
            <div className="flex-1 flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="w-4 h-4 text-primary" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="address">Full Address</Label>
                    <Input
                      id="address"
                      placeholder="123 Main St, City, State, ZIP"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      data-testid="input-address"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CreditCard className="w-4 h-4 text-primary" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger data-testid="select-payment-method">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Credit Card">Credit Card</SelectItem>
                      <SelectItem value="Debit Card">Debit Card</SelectItem>
                      <SelectItem value="Cash on Delivery">Cash on Delivery</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>

            {/* Summary */}
            <div className="lg:w-72">
              <Card>
                <CardContent className="p-5 flex flex-col gap-3">
                  <h2 className="font-semibold">Order Summary</h2>
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
                    <span data-testid="text-checkout-total">${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <Button
                    className="w-full mt-2"
                    onClick={() => orderMutation.mutate()}
                    disabled={orderMutation.isPending || !address.trim() || !paymentMethod}
                    data-testid="button-place-order"
                  >
                    {orderMutation.isPending ? "Placing Order..." : "Place Order"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
