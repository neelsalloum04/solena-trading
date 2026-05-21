# Solena AI Trading Platform

A premium SaaS trading platform with AI-powered signals, automated bots, and institutional-grade market analysis.

## Tech Stack
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Payments**: Stripe (subscriptions)
- **AI**: OpenAI GPT-4o (chat + vision for chart analysis)
- **Trading**: Binance API, Alpaca API (+ MT4/5, Bybit, Kraken, IB)
- **Charts**: Recharts

## Features
- 🤖 **AI Trading Chat** — GPT-4o powered analyst with TradingView chart upload
- 📡 **Live Signals** — Real-time AI trading signals across all markets
- 🤖 **Auto Trading Bot** — Connect 7+ brokers, 24/7 automated trading
- 📊 **Portfolio Dashboard** — Full performance tracking and analytics
- 💳 **Stripe Subscriptions** — Starter $49/mo, Pro $149/mo, Elite $399/mo
- 🔒 **Supabase Auth** — Email/password + OAuth
- 🛡️ **Admin Dashboard** — User management, revenue analytics, system health

## Quick Start

```bash
# Install dependencies
npm install

# Copy and fill env vars
cp .env.example .env.local

# Run development server
npm run dev
```

## Environment Variables

See `.env.example` for all required variables:
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase project
- `OPENAI_API_KEY` — For AI chat and signal generation
- `STRIPE_SECRET_KEY` + price IDs — For subscriptions
- Broker API keys (optional) — Binance, Alpaca, etc.

## Database Setup

Run the migration in Supabase SQL editor:
```
supabase/migrations/001_initial_schema.sql
```

## Pages
- `/` — Landing page (marketing)
- `/login` & `/register` — Auth
- `/dashboard` — Main dashboard with portfolio overview
- `/chat` — AI trading analyst chat
- `/signals` — Live trading signals
- `/bot` — Auto trading bot management
- `/portfolio` — Trade history & allocation
- `/analytics` — Advanced performance metrics
- `/settings` — Account, subscription, notifications
- `/admin` — Admin panel (user stats, revenue, system health)
