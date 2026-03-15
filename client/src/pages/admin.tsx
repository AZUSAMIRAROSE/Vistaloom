import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Package, Shield } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Product, Customer, InsertProduct } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const CATEGORIES = ["Electronics", "Computers", "Accessories", "Phones", "Audio", "Other"];
const EMPTY_FORM: Omit<InsertProduct, "createdAt"> = {
  name: "",
  price: "0",
  category: "",
  description: "",
  image: "",
};

export default function Admin() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: user } = useQuery<Customer | null>({ queryKey: ["/api/auth/me"] });
  const { data: products = [], isLoading } = useQuery<Product[]>({ queryKey: ["/api/products"] });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => apiRequest("POST", "/api/products", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      toast({ title: "Product created successfully" });
    },
    onError: (err: Error) => toast({ title: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof form }) =>
      apiRequest("PUT", `/api/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setDialogOpen(false);
      setEditProduct(null);
      setForm(EMPTY_FORM);
      toast({ title: "Product updated successfully" });
    },
    onError: (err: Error) => toast({ title: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product deleted" });
    },
    onError: (err: Error) => toast({ title: err.message, variant: "destructive" }),
  });

  if (!user || !user.isAdmin) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Shield className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="font-semibold text-lg">Admin access required</p>
          <p className="text-muted-foreground text-sm">You don't have permission to view this page.</p>
          <Link href="/"><Button>Go Home</Button></Link>
        </div>
      </Layout>
    );
  }

  function openCreate() {
    setEditProduct(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(product: Product) {
    setEditProduct(product);
    setForm({
      name: product.name,
      price: product.price,
      category: product.category,
      description: product.description,
      image: product.image,
    });
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editProduct) {
      updateMutation.mutate({ id: editProduct.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Admin Panel</h1>
          </div>
          <Button onClick={openCreate} className="gap-2" data-testid="button-add-product">
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-product-count">{products.length}</p>
                <p className="text-sm text-muted-foreground">Total Products</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-md flex items-center justify-center">
                <Package className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{CATEGORIES.length}</p>
                <p className="text-sm text-muted-foreground">Categories</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-md flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  ${products.reduce((s, p) => s + parseFloat(p.price), 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </p>
                <p className="text-sm text-muted-foreground">Total Value</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Products</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 flex flex-col gap-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : products.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground flex flex-col items-center gap-2">
                <Package className="w-8 h-8" />
                <p>No products yet. Add one to get started.</p>
              </div>
            ) : (
              <div className="divide-y">
                {products.map(product => (
                  <div
                    key={product.id}
                    className="px-4 py-3 flex items-center gap-4"
                    data-testid={`row-product-${product.id}`}
                  >
                    <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                      <img
                        src={product.image.startsWith("http") ? product.image : `/uploads/products/${product.image}`}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/48x48?text=P"; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" data-testid={`text-admin-product-name-${product.id}`}>
                        {product.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                        <span className="text-sm font-semibold text-primary">
                          ${parseFloat(product.price).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEdit(product)}
                        data-testid={`button-edit-product-${product.id}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (confirm("Delete this product?")) deleteMutation.mutate(product.id);
                        }}
                        className="text-destructive"
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-product-${product.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) setEditProduct(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prod-name">Name</Label>
              <Input
                id="prod-name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Product name"
                required
                data-testid="input-product-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="prod-price">Price ($)</Label>
                <Input
                  id="prod-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="0.00"
                  required
                  data-testid="input-product-price"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="prod-category">Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger id="prod-category" data-testid="select-product-category">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prod-desc">Description</Label>
              <Textarea
                id="prod-desc"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Product description"
                rows={3}
                required
                data-testid="input-product-description"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prod-image">Image URL</Label>
              <Input
                id="prod-image"
                value={form.image}
                onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                placeholder="https://example.com/image.jpg"
                required
                data-testid="input-product-image"
              />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending} data-testid="button-save-product">
                {isPending ? "Saving..." : (editProduct ? "Update" : "Create")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
