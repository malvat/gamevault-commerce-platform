# Game Store MERN

A MERN game store where customers can register, log in, browse games, manage wishlists, purchase games through Stripe Checkout, view their library, add friends, and chat in real time. Admin users can create, edit, feature, and remove games from the catalog.

## Live Demo

Deployed demo: [http://98.81.36.117:5000/](http://98.81.36.117:5000/)

## Tech Stack

- MongoDB, Express, React, Node.js
- JWT authentication with role-based admin access
- Vite React client with reusable state contexts
- REST API for auth, games, wishlist, orders, friends, chat history, and admin catalog management
- Socket.IO for real-time friend chat
- Stripe Checkout for sandbox purchases
- Docker support for single-server deployment and scheduled report generation

## Getting Started

1. Install dependencies:

```bash
npm run install:all
```

2. Create `server/.env` from the example:

```bash
cp server/.env.example server/.env
```

3. Add your MongoDB connection string, JWT secret, and Stripe sandbox secret key to `server/.env`.

4. Seed demo users and games:

```bash
npm run seed
```

5. Start the app:

```bash
npm run dev
```

The client runs on `http://localhost:5173` and the API runs on `http://localhost:5000`.

## Stripe Sandbox Checkout

Purchases use Stripe Checkout in test mode. Add a test secret key to `server/.env`:

```bash
STRIPE_SECRET_KEY=sk_test_your_stripe_sandbox_secret_key
CLIENT_URL=http://localhost:5173
```

Use Stripe test card `4242 4242 4242 4242` with any future expiry date, CVC, and ZIP code.

After a successful checkout, the app confirms the Stripe session, creates a paid order, prevents duplicate purchases of already-owned games, and makes purchased games available in the user's library.

## Weekly Order Reports

The app includes an internal weekly reporting job. It is not an API endpoint; it is a Node script that connects to MongoDB, reads paid orders from the last 7 days, aggregates purchased games, and writes a JSON report to disk.

Run it manually for demos:

```bash
npm --prefix server run report:weekly-orders
```

Reports are written to:

```text
server/reports/weekly-orders/
```

The Docker setup also includes a scheduler container that runs the same script every Friday at 9:00 AM:

```bash
docker compose up --build weekly-report-scheduler
```

The scheduler writes reports through a mounted volume, so generated JSON files appear in the local `server/reports/weekly-orders/` folder.

## Tests

Run all tests:

```bash
npm test
```

Run the backend tests:

```bash
npm --prefix server test
```

Run the frontend tests:

```bash
npm --prefix client test
```

The backend suite covers auth/profile APIs, order creation rules, friend request and chat flows, and weekly report aggregation. The frontend suite covers signed-in navigation, profile form state, and Stripe checkout session creation from the cart.

## Docker

Build and run the app in one container:

```bash
docker compose up --build
```

The container serves the API and built React app at `http://localhost:5000`.

Docker reads environment variables from `server/.env`. Use `server/.env.example` as the template.

The `weekly-report-scheduler` service runs the weekly order report job every Friday at 9:00 AM inside Docker. It shares the same report output folder through a volume:

```bash
docker compose up --build weekly-report-scheduler
```

## Demo Accounts

- Admin: `admin@gamestore.dev` / `Admin123!`
- Customer: `player@gamestore.dev` / `Player123!`
- Customer: `noah.player@test.com` / `Player123!`
- Customer: `ava.player@test.com` / `Player123!`
- Customer: `maya.player@test.com` / `Player123!`
- Customer: `liam.player@test.com` / `Player123!`
- Customer: `sofia.player@test.com` / `Player123!`
- Customer: `ethan.player@test.com` / `Player123!`
- Customer: `grace.player@test.com` / `Player123!`
- Customer: `owen.player@test.com` / `Player123!`

## Current Features

- Customer registration and login with JWT sessions
- Protected routes for customer account pages and admin-only catalog tools
- Editable customer profile with first and last name fields
- Game catalog with search, genre filters, pagination, ratings, platform tags, and featured titles
- Game detail pages with purchase actions, wishlist controls, and review display
- Wishlist page for saved games
- Cart with quantity controls, ownership checks, and duplicate-purchase prevention
- Stripe sandbox checkout with checkout success confirmation
- Customer order history
- Purchased-game library with download actions
- Friends page with email-based user search
- Friend request sending, incoming request review, accept, and reject actions
- Real-time one-to-one chat between accepted friends using Socket.IO
- Persisted conversation history loaded from the API
- Admin dashboard for adding, editing, deleting, and featuring games
- Weekly JSON order reports with a Docker-level scheduler
- Dockerized production build serving the React app and API from one Node server

## Next Feature Ideas

- Unread chat badges and typing indicators
- Friend removal or blocking
- Game key delivery
- Sales analytics dashboard
- Richer review creation and moderation tools