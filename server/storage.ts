import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { eq, and } from "drizzle-orm";
import type {
  Customer, InsertCustomer,
  Product, InsertProduct,
  Cart, InsertCart, CartItem,
  Order, InsertOrder, OrderItem,
} from "@shared/schema";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

export interface IStorage {
  // Customers
  getCustomer(id: number): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;

  // Products
  getAllProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<void>;

  // Cart
  getCartItems(customerId: number): Promise<CartItem[]>;
  addToCart(item: InsertCart): Promise<Cart>;
  removeFromCart(productId: number, customerId: number): Promise<void>;
  isInCart(productId: number, customerId: number): Promise<boolean>;
  clearCart(customerId: number): Promise<void>;
  getCartTotal(customerId: number): Promise<number>;

  // Orders
  placeOrder(customerId: number, productIds: number[], address: string, paymentMethod: string): Promise<void>;
  getOrders(customerId: number): Promise<OrderItem[]>;
}

export class DatabaseStorage implements IStorage {
  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(schema.customers).where(eq(schema.customers.id, id));
    return customer;
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(schema.customers).where(eq(schema.customers.email, email));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [created] = await db.insert(schema.customers).values(customer).returning();
    return created;
  }

  async getAllProducts(): Promise<Product[]> {
    return db.select().from(schema.products).orderBy(schema.products.createdAt);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(schema.products).where(eq(schema.products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [created] = await db.insert(schema.products).values(product).returning();
    return created;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updated] = await db.update(schema.products).set(product).where(eq(schema.products.id, id)).returning();
    return updated;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(schema.products).where(eq(schema.products.id, id));
  }

  async getCartItems(customerId: number): Promise<CartItem[]> {
    const items = await db.select().from(schema.carts).where(eq(schema.carts.customerId, customerId));
    const result: CartItem[] = [];
    for (const item of items) {
      const [product] = await db.select().from(schema.products).where(eq(schema.products.id, item.productId));
      if (product) result.push({ ...item, product });
    }
    return result;
  }

  async addToCart(item: InsertCart): Promise<Cart> {
    const [created] = await db.insert(schema.carts).values(item).returning();
    return created;
  }

  async removeFromCart(productId: number, customerId: number): Promise<void> {
    await db.delete(schema.carts).where(
      and(eq(schema.carts.productId, productId), eq(schema.carts.customerId, customerId))
    );
  }

  async isInCart(productId: number, customerId: number): Promise<boolean> {
    const [item] = await db.select().from(schema.carts).where(
      and(eq(schema.carts.productId, productId), eq(schema.carts.customerId, customerId))
    );
    return !!item;
  }

  async clearCart(customerId: number): Promise<void> {
    await db.delete(schema.carts).where(eq(schema.carts.customerId, customerId));
  }

  async getCartTotal(customerId: number): Promise<number> {
    const items = await this.getCartItems(customerId);
    return items.reduce((sum, item) => sum + parseFloat(item.product.price), 0);
  }

  async placeOrder(customerId: number, productIds: number[], address: string, paymentMethod: string): Promise<void> {
    for (const productId of productIds) {
      await db.insert(schema.orders).values({
        productId,
        customerId,
        status: "Pending",
        paymentMethod,
        paymentStatus: "Pending",
        address,
      });
    }
    await this.clearCart(customerId);
  }

  async getOrders(customerId: number): Promise<OrderItem[]> {
    const orderList = await db.select().from(schema.orders).where(eq(schema.orders.customerId, customerId));
    const result: OrderItem[] = [];
    for (const order of orderList) {
      const [product] = await db.select().from(schema.products).where(eq(schema.products.id, order.productId));
      if (product) result.push({ ...order, product });
    }
    return result;
  }
}

export const storage = new DatabaseStorage();
