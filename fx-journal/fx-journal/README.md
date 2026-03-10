# FX Journal — Terminal Pro

A professional forex trading journal built with Next.js 14, Supabase, and Recharts.

![FX Journal Dashboard](public/preview.png)

## Features

- **Multi-user auth** — email/password + Google OAuth via Supabase
- **Trade logging** — symbol, side, lots, entry/exit, pips (auto-calc), P&L, setup tags, emotion tags, session, notes
- **Dashboard** — animated gauges (win rate, profit factor, R:R, pips), equity curve, monthly P&L, symbol breakdown, session donut
- **Analytics** — full stats, emotion analysis, setup analysis, day-of-week breakdown, daily P&L heatmap
- **AI Insights** — auto-generated coaching based on your trade history
- **Setups library** — store and rate your personal trade setups
- **Mistake tracker** — log recurring mistakes with occurrence counter
- **Weekly review** — this-week stats + reflection notes (persisted per week)
- **Trading plan** — editable markdown document saved per user
- **TradingView webhook** — auto-log trades from TradingView alerts
- **Row-level security** — every user only sees their own data

---

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/fx-journal.git
cd fx-journal
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) → New project
2. Go to **SQL Editor** → paste and run `supabase/migrations/001_init.sql`
3. Go to **Authentication → Providers** → enable Google (optional)
4. Copy your project URL and anon key from **Settings → API**

### 3. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
WEBHOOK_SECRET=make-up-any-random-string
```

### 4. Run locally

```bash
npm run dev
# Open http://localhost:3000
```

---

## TradingView Webhook Setup

1. In TradingView → create an Alert
2. Set **Webhook URL** to: `https://yourdomain.com/api/webhook?secret=YOUR_WEBHOOK_SECRET`
3. Set **Message** to JSON:
```json
{
  "symbol": "EURUSD",
  "side": "BUY",
  "price": {{close}},
  "lots": 0.1,
  "user_id": "your-supabase-user-id",
  "pips": 30,
  "pnl": 150
}
```
4. Trades will auto-appear in your journal

---

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Add all environment variables in the Vercel dashboard under **Settings → Environment Variables**.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Charts | Recharts |
| Hosting | Vercel |

---

## Project Structure

```
fx-journal/
├── app/
│   ├── auth/
│   │   ├── login/          # Login page
│   │   ├── register/       # Register page
│   │   └── callback/       # OAuth callback
│   ├── dashboard/          # Main dashboard
│   ├── trades/             # Trade log + add trade modal
│   ├── analytics/          # Full analytics + heatmap
│   ├── setups/             # Setups library
│   ├── mistakes/           # Mistake tracker
│   ├── weekly/             # Weekly review
│   ├── ai-insights/        # AI-generated coaching
│   ├── plan/               # Trading plan editor
│   └── api/
│       ├── trades/         # REST API for trades
│       └── webhook/        # TradingView webhook
├── components/
│   ├── Sidebar.tsx         # Navigation sidebar
│   └── charts/             # Recharts components
├── lib/
│   ├── supabase.ts         # Browser client
│   ├── supabase-server.ts  # Server client
│   └── utils.ts            # Helpers
├── types/
│   └── index.ts            # TypeScript types + computeStats
└── supabase/
    └── migrations/
        └── 001_init.sql    # Database schema + RLS
```

---

## License

MIT
