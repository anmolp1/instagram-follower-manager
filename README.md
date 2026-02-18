# Instagram Follower Manager

A free, privacy-first web app to analyze your Instagram followers. See who doesn't follow you back, find your fans, track changes over time, and batch-open profiles to unfollow — all without risking your account.

**Live app:** [anmolp1.github.io/instagram-follower-manager](https://anmolp1.github.io/instagram-follower-manager/)

## Features

- **Data export import** — Upload your official Instagram data export (JSON files). No API scraping, no session cookies, no ban risk.
- **Follower analysis** — See who doesn't follow you back, who your fans are, and your mutual connections.
- **Batch open profiles** — Open profiles 5 at a time in new tabs to manually unfollow. Progress is tracked in the UI so you can pick up where you left off.
- **Search and filter** — Quickly find specific users across any list.
- **Copy profile links** — Copy selected or all profile links to clipboard.
- **History tracking** — Upload new exports over time to track who followed/unfollowed you.
- **Fully client-side** — All data stays in your browser's localStorage. Nothing is sent to any server.

## Getting Started

### 1. Export your Instagram data

1. Open Instagram → Settings → Your Activity → Download Your Information
2. Select **JSON** format and request your data
3. Instagram will email you a download link (usually within a few minutes)
4. Download and unzip — you need `followers_1.json` and `following.json`

### 2. Upload to the app

1. Go to [the app](https://anmolp1.github.io/instagram-follower-manager/) (or run locally)
2. Click **Upload** and select your `followers_1.json` and `following.json` files
3. The app parses everything in your browser — nothing leaves your machine

### 3. Analyze

- **Not Following Back** — People you follow who don't follow you back
- **Fans** — People who follow you but you don't follow back
- **Mutuals** — People you follow each other with

### 4. Unfollow

Click **"Open Next 5"** to open profiles in new browser tabs. Unfollow each one manually on Instagram, close the tabs, and click again for the next batch. A progress bar tracks how far along you are.

This is the safest approach — you're using Instagram's real UI with your real session, so there's no risk of your account being flagged or banned.

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router, static export)
- TypeScript
- [Tailwind CSS v4](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Lucide Icons](https://lucide.dev)
- GitHub Pages (hosting)

## Project Structure

```
app/
  page.tsx              # Dashboard — overview stats
  upload/page.tsx       # Upload Instagram data export
  diff/page.tsx         # Follower analysis with batch open
  history/page.tsx      # Snapshot history over time
components/
  nav.tsx               # Navigation bar with clear data
  file-upload.tsx       # Drag-and-drop file upload
  user-table.tsx        # User list with search, select, batch open
  stats-card.tsx        # Dashboard stat card
lib/
  types.ts              # TypeScript types
  instagram-parser.ts   # Parse Instagram export JSON
  client-storage.ts     # localStorage-based snapshot storage
  diff.ts               # Follower diff and history computation
```

## Privacy

All data stays in your browser. No server, no cookies, no third-party services. The app is a static site hosted on GitHub Pages — it can't even receive your data if it wanted to. Click **Clear Data** in the nav to wipe everything from localStorage.
