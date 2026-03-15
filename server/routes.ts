import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCustomerSchema, insertProductSchema, loginSchema, placeOrderSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";

declare module "express-session" {
  interface SessionData {
    customerId?: number;
  }
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const data = insertCustomerSchema.parse(req.body);
      const existing = await storage.getCustomerByEmail(data.email);
      if (existing) return res.status(400).json({ error: "Email already in use" });
      const hashed = await bcrypt.hash(data.password, 10);
      const customer = await storage.createCustomer({ ...data, password: hashed });
      req.session.customerId = customer.id;
      const { password: _, ...safe } = customer;
      res.json(safe);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const data = loginSchema.parse(req.body);
      const customer = await storage.getCustomerByEmail(data.email);
      if (!customer) return res.status(401).json({ error: "Invalid email or password" });
      const match = await bcrypt.compare(data.password, customer.password);
      if (!match) return res.status(401).json({ error: "Invalid email or password" });
      req.session.customerId = customer.id;
      const { password: _, ...safe } = customer;
      res.json(safe);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(() => res.json({ success: true }));
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    if (!req.session.customerId) return res.status(401).json({ error: "Not authenticated" });
    const customer = await storage.getCustomer(req.session.customerId);
    if (!customer) return res.status(401).json({ error: "Not authenticated" });
    const { password: _, ...safe } = customer;
    res.json(safe);
  });

  // Products routes
  app.get("/api/products", async (_req: Request, res: Response) => {
    const products = await storage.getAllProducts();
    res.json(products);
  });

  app.get("/api/products/:id", async (req: Request, res: Response) => {
    const product = await storage.getProduct(parseInt(req.params.id));
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  });

  app.post("/api/products", async (req: Request, res: Response) => {
    if (!req.session.customerId) return res.status(401).json({ error: "Not authenticated" });
    const customer = await storage.getCustomer(req.session.customerId);
    if (!customer?.isAdmin) return res.status(403).json({ error: "Admin only" });
    try {
      const data = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(data);
      res.json(product);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put("/api/products/:id", async (req: Request, res: Response) => {
    if (!req.session.customerId) return res.status(401).json({ error: "Not authenticated" });
    const customer = await storage.getCustomer(req.session.customerId);
    if (!customer?.isAdmin) return res.status(403).json({ error: "Admin only" });
    try {
      const data = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(parseInt(req.params.id), data);
      if (!product) return res.status(404).json({ error: "Product not found" });
      res.json(product);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/products/:id", async (req: Request, res: Response) => {
    if (!req.session.customerId) return res.status(401).json({ error: "Not authenticated" });
    const customer = await storage.getCustomer(req.session.customerId);
    if (!customer?.isAdmin) return res.status(403).json({ error: "Admin only" });
    await storage.deleteProduct(parseInt(req.params.id));
    res.json({ success: true });
  });

  // Cart routes
  app.get("/api/cart", async (req: Request, res: Response) => {
    if (!req.session.customerId) return res.status(401).json({ error: "Not authenticated" });
    const items = await storage.getCartItems(req.session.customerId);
    res.json(items);
  });

  app.post("/api/cart", async (req: Request, res: Response) => {
    if (!req.session.customerId) return res.status(401).json({ error: "Not authenticated" });
    const { productId } = z.object({ productId: z.number() }).parse(req.body);
    const already = await storage.isInCart(productId, req.session.customerId);
    if (already) return res.status(400).json({ error: "Product already in cart" });
    const item = await storage.addToCart({ productId, customerId: req.session.customerId });
    res.json(item);
  });

  app.delete("/api/cart/:productId", async (req: Request, res: Response) => {
    if (!req.session.customerId) return res.status(401).json({ error: "Not authenticated" });
    await storage.removeFromCart(parseInt(req.params.productId), req.session.customerId);
    res.json({ success: true });
  });

  // Orders routes
  app.get("/api/orders", async (req: Request, res: Response) => {
    if (!req.session.customerId) return res.status(401).json({ error: "Not authenticated" });
    const orders = await storage.getOrders(req.session.customerId);
    res.json(orders);
  });

  app.post("/api/orders", async (req: Request, res: Response) => {
    if (!req.session.customerId) return res.status(401).json({ error: "Not authenticated" });
    try {
      const { address, paymentMethod } = placeOrderSchema.parse(req.body);
      const cartItems = await storage.getCartItems(req.session.customerId);
      if (cartItems.length === 0) return res.status(400).json({ error: "Cart is empty" });
      const productIds = cartItems.map(i => i.productId);
      await storage.placeOrder(req.session.customerId, productIds, address, paymentMethod);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  return httpServer;
}
