import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function seed() {
  console.log("Seeding database...");

  // Create admin user if not exists
  const existingAdmin = await db.select().from(schema.customers).where(eq(schema.customers.email, "admin@shopbase.com"));
  if (existingAdmin.length === 0) {
    const hashed = await bcrypt.hash("admin123", 10);
    await db.insert(schema.customers).values({
      name: "Admin User",
      email: "admin@shopbase.com",
      password: hashed,
      isAdmin: true,
    });
    console.log("Created admin user: admin@shopbase.com / admin123");
  }

  // Create demo customer if not exists
  const existingDemo = await db.select().from(schema.customers).where(eq(schema.customers.email, "demo@shopbase.com"));
  if (existingDemo.length === 0) {
    const hashed = await bcrypt.hash("demo123", 10);
    await db.insert(schema.customers).values({
      name: "Demo User",
      email: "demo@shopbase.com",
      password: hashed,
      isAdmin: false,
    });
    console.log("Created demo user: demo@shopbase.com / demo123");
  }

  // Seed products if none exist
  const existingProducts = await db.select().from(schema.products);
  if (existingProducts.length === 0) {
    await db.insert(schema.products).values([
      {
        name: "MacBook Pro 14-inch",
        price: "1999.00",
        category: "Computers",
        description: "Apple M3 Pro chip, 18GB RAM, 512GB SSD. The most powerful MacBook Pro ever.",
        image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format",
      },
      {
        name: "Sony WH-1000XM5 Headphones",
        price: "349.99",
        category: "Audio",
        description: "Industry-leading noise canceling with Dual Noise Sensor technology. Up to 30-hour battery life.",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format",
      },
      {
        name: "iPhone 15 Pro",
        price: "999.00",
        category: "Phones",
        description: "A17 Pro chip, titanium design, 48MP main camera with 5x telephoto zoom.",
        image: "https://images.unsplash.com/photo-1696446701796-da61c28ca784?w=600&auto=format",
      },
      {
        name: "Samsung 4K OLED Monitor 27\"",
        price: "799.99",
        category: "Electronics",
        description: "27-inch OLED display, 3840x2160 resolution, 144Hz refresh rate, 0.03ms response time.",
        image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format",
      },
      {
        name: "Logitech MX Master 3S Mouse",
        price: "99.99",
        category: "Accessories",
        description: "High-performance wireless mouse with MagSpeed scrolling, 8K DPI sensor, and USB-C charging.",
        image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&auto=format",
      },
      {
        name: "iPad Air 11-inch",
        price: "599.00",
        category: "Electronics",
        description: "M2 chip, 11-inch Liquid Retina display, Wi-Fi 6E, Apple Pencil Pro support.",
        image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format",
      },
      {
        name: "Samsung Galaxy S24 Ultra",
        price: "1199.00",
        category: "Phones",
        description: "200MP camera, S Pen included, AI-powered features, Snapdragon 8 Gen 3, 5000mAh battery.",
        image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&auto=format",
      },
      {
        name: "Mechanical Keyboard Keychron Q2",
        price: "149.99",
        category: "Accessories",
        description: "65% compact layout, hot-swappable switches, aluminum body, RGB backlight, Mac/Windows compatible.",
        image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format",
      },
    ]);
    console.log("Created 8 sample products");
  }

  console.log("Seeding complete!");
  await pool.end();
}

seed().catch(console.error);
