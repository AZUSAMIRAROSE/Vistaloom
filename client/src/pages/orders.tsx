import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrderItem, Customer } from "@shared/schema";
import { Link } from "wouter";

const statusColors: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  Processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  Shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  Delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function Orders() {
  const { data: user } = useQuery<Customer | null>({ queryKey: ["/api/auth/me"] });
  const { data: orders = [], isLoading } = useQuery<OrderItem[]>({
    queryKey: ["/api/orders"],
    enabled: !!user,
  });

  if (!user) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center flex flex-col items-center gap-4">
          <p className="font-semibold text-lg">Sign in to view your orders</p>
          <Link href="/login"><Button>Sign In</Button></Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">My Orders</h1>
          {orders.length > 0 && (
            <span className="text-muted-foreground text-sm">({orders.length} order{orders.length !== 1 ? "s" : ""})</span>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <Card key={i}><CardContent className="p-4 flex gap-4"><Skeleton className="w-20 h-20 rounded-md" /><div className="flex-1 flex flex-col gap-2"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/3" /><Skeleton className="h-6 w-24" /></div></CardContent></Card>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-lg">No orders yet</p>
              <p className="text-muted-foreground text-sm mt-1">Your order history will appear here</p>
            </div>
            <Link href="/"><Button>Start Shopping</Button></Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map(order => (
              <Card key={order.id} data-testid={`card-order-${order.id}`}>
                <CardContent className="p-4 flex gap-4 items-start">
                  <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                    <img
                      src={order.product.image.startsWith("http") ? order.product.image : `/uploads/products/${order.product.image}`}
                      alt={order.product.name}
                      className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/80x80?text=Item"; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" data-testid={`text-order-product-${order.id}`}>
                      {order.product.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{order.product.category}</p>
                    <p className="text-lg font-bold text-primary mt-1">
                      ${parseFloat(order.product.price).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status] || statusColors.Pending}`} data-testid={`status-order-${order.id}`}>
                        {order.status}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        {order.paymentMethod}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Deliver to: {order.address}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground flex-shrink-0 text-right">
                    Order #{order.id}
                    <br />
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
