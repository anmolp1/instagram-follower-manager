# Instagram Follower Manager

A local web app to analyze your Instagram followers and following using Instagram's data export. See who doesn't follow you back, track follower changes over time, and copy profile links for batch unfollowing.

## Features

- **Dashboard** — Overview of follower/following counts, not-following-back, fans, and mutuals
- **Data Import** — Drag-and-drop upload of Instagram's "Download Your Data" JSON files
- **Follower Analysis** — Tabbed view to browse Not Following Back, Fans, and Mutuals with search/filter
- **Select & Copy Links** — Select users who don't follow you back and copy their profile links for manual unfollowing
- **History Tracking** — Upload multiple exports over time to see who followed/unfollowed you

## Getting Started

### 1. Get your Instagram data

1. Open Instagram → Settings → Your Activity → Download Your Information
2. Request your data in **JSON** format
3. Download and extract the ZIP — you'll need `followers_1.json` and `following.json`

### 2. Run the app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Upload your data

Go to the **Upload** page, drag and drop your `followers_1.json` and `following.json` files, and click Upload.

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router)
- TypeScript
- [Tailwind CSS v4](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Lucide Icons](https://lucide.dev)

## Project Structure

```
app/
  page.tsx              # Dashboard
  upload/page.tsx       # Data import
  diff/page.tsx         # Follower analysis (tabs)
  history/page.tsx      # Snapshot history
  api/
    upload/route.ts     # File upload & parsing
    snapshots/route.ts  # List snapshots
    diff/route.ts       # Compute diffs
components/
  nav.tsx               # Navigation bar
  stats-card.tsx        # Stats display card
  file-upload.tsx       # Drag-and-drop upload
  user-table.tsx        # User list with select/filter/copy
lib/
  types.ts              # TypeScript types
  instagram-parser.ts   # Parse Instagram export format
  storage.ts            # JSON file-based snapshot storage
  diff.ts               # Follower diff computation
data/                   # Local snapshots (gitignored)
```

## Privacy

All data stays on your machine. No external APIs, no cloud storage — just local JSON files in the `data/` directory.
