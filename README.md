# KK Trading Journal — Keval Kabariya
Full-Stack Forex Trading Journal | Node.js + React + Express

## Quick Start (Windows)

1. Double-click INSTALL.bat  (installs everything)
2. Double-click START.bat    (starts both servers + opens browser)
3. Open http://localhost:3000

## Manual Setup

Install Node.js from https://nodejs.org (LTS version)

Then in Command Prompt:
  cd backend  && npm install
  cd ../frontend && npm install

Run (two terminals):
  Terminal 1: cd backend  && node server.js
  Terminal 2: cd frontend && npm run dev

## Features
- Dashboard: account value, equity curve, daily P&L
- Profit Calendar: monthly view with green/red days in $
- Consistency Meter: prop firm rule tracker
- Trade Journal: log trades, auto share card on click
- Live P&L Calc: pips x lots = $ as you type
- Analysis: full stats, equity/drawdown, emotions, strategies
- Backtest: TradingView chart with replay mode
- Share Card: PNG export matching TradeFXBook style

## TradingView Replay
1. Backtest tab -> Load Chart
2. Click clock icon in chart bottom bar
3. Select start date -> use Play/Step buttons

## Deploy to GitHub
  git init && git add . && git commit -m "init"
  git remote add origin https://github.com/YOUR-USER/kk-trading-journal.git
  git push -u origin main

Then Railway (backend) + Vercel (frontend) for free hosting.

## Data
Stored in backend/data.json — back this file up regularly!

## Tech Stack
React 18 + Vite | Node.js + Express | JSON file DB | Chart.js | TradingView
