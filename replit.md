# ShopBase - E-Commerce Application

## Overview
A full-stack e-commerce application with product browsing, cart management, order placement, and admin product management.

## Tech Stack
- **Frontend**: React + TypeScript, TanStack Query, Wouter, Tailwind CSS, shadcn/ui
- **Backend**: Express.js + TypeScript, Drizzle ORM, PostgreSQL
- **Auth**: Session-based authentication with bcrypt password hashing

## Architecture
- `client/src/` - React frontend
- `server/` - Express backend (index.ts, routes.ts, storage.ts)
- `shared/schema.ts` - Drizzle ORM schemas shared between frontend and backend

## Pages
- `/` - Product shop (browse, search, filter by category)
- `/login` - Sign in / Register
- `/cart` - Shopping cart
- `/checkout` - Place an order
- `/orders` - Order history & tracking
- `/admin` - Admin panel (product CRUD, admin users only)

## Database Schema
- `customers` - id, name, email, password (hashed), isAdmin, createdAt
- `products` - id, name, price, category, description, image, createdAt
- `carts` - id, productId, customerId, createdAt
- `orders` - id, productId, customerId, status, paymentMethod, paymentStatus, address, createdAt

## Demo Accounts
- **Admin**: admin@shopbase.com / admin123
- **User**: demo@shopbase.com / demo123

## Running
The app runs via `npm run dev` which starts Express + Vite on port 5000.

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption secret
