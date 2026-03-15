import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Search, Tag, Package } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Product, Customer } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const CATEGORIES = ["All", "Electronics", "Computers", "Accessories", "Phones", "Audio", "Other"];

function ProductCard({ product, user }: { product: Product; user: Customer | null | undefined }) {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const addToCartMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/cart", { productId: product.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({ title: "Added to cart", description: product.name });
    },
    onError: (err: Error) => {
      if (err.message.includes("authenticated")) {
        toast({ title: "Sign in required", description: "Please log in to add items to cart", variant: "destructive" });
        navigate("/login");
      } else {
        toast({ title: err.message, variant: "destructive" });
      }
    },
  });

  return (
    <Card className="group flex flex-col overflow-hidden hover-elevate" data-testid={`card-product-${product.id}`}>
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        <img
          src={product.image.startsWith("http") ? product.image : `/uploads/products/${product.image}`}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/400x300?text=Product"; }}
          data-testid={`img-product-${product.id}`}
        />
        <Badge className="absolute top-2 left-2 text-xs" data-testid={`badge-category-${product.id}`}>
          {product.category}
        </Badge>
      </div>
      <CardContent className="flex-1 p-4 flex flex-col gap-2">
        <h3 className="font-semibold text-base leading-tight line-clamp-2" data-testid={`text-product-name-${product.id}`}>
          {product.name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-product-desc-${product.id}`}>
          {product.description}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between gap-2">
        <span className="text-xl font-bold text-primary" data-testid={`text-product-price-${product.id}`}>
          ${parseFloat(product.price).toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </span>
        <Button
          size="sm"
          onClick={() => addToCartMutation.mutate()}
          disabled={addToCartMutation.isPending}
          className="gap-2"
          data-testid={`button-add-cart-${product.id}`}
        >
          <ShoppingCart className="w-4 h-4" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}

function ProductSkeleton() {
  return (
    <Card className="flex flex-col overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full" />
      <CardContent className="p-4 flex flex-col gap-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-9 w-28" />
      </CardFooter>
    </Card>
  );
}

export default function Home() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: user } = useQuery<Customer | null>({
    queryKey: ["/api/auth/me"],
  });

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || p.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <Layout>
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 flex flex-col gap-4 items-center text-center">
          <Badge variant="secondary" className="gap-1">
            <Tag className="w-3 h-3" />
            New arrivals every week
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Shop the Latest <br className="hidden sm:block" />
            <span className="text-primary">Electronics & Gadgets</span>
          </h1>
          <p className="text-muted-foreground max-w-md text-lg">
            Discover top-rated products at unbeatable prices. Fast shipping, easy returns.
          </p>
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        {/* Category filter */}
        <div className="flex gap-2 flex-wrap" data-testid="category-filters">
          {CATEGORIES.map(cat => (
            <Button
              key={cat}
              variant={category === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory(cat)}
              data-testid={`button-category-${cat.toLowerCase()}`}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Results header */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground" data-testid="text-results-count">
            {isLoading ? "Loading..." : `${filtered.length} product${filtered.length !== 1 ? "s" : ""} found`}
          </p>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-lg">No products found</p>
              <p className="text-muted-foreground text-sm mt-1">Try adjusting your search or filters</p>
            </div>
            <Button variant="outline" onClick={() => { setSearch(""); setCategory("All"); }}>
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(product => (
              <ProductCard key={product.id} product={product} user={user} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
