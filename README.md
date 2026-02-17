# Instagram Follower Manager

A local web app to analyze and manage your Instagram followers. See who doesn't follow you back, batch unfollow them, and track follower changes over time.

## Features

- **Auto-fetch via session cookie** — Paste your Instagram browser cookies to automatically pull your full followers/following lists
- **Paste import** — Copy-paste raw text from Instagram's followers/following popup — usernames are extracted automatically
- **Dashboard** — Overview of follower/following counts, not-following-back, fans, and mutuals
- **Follower Analysis** — Tabbed view to browse Not Following Back, Fans, and Mutuals with search/filter
- **Batch Unfollow** — Select users who don't follow you back and unfollow them directly from the app
- **Copy Profile Links** — Copy selected profile links to clipboard for manual review
- **History Tracking** — Import data multiple times to track who followed/unfollowed you over time
- **Logout & Reset** — Clear all session data and saved snapshots with one click

## Getting Started

### 1. Run the app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Import your data

**Option A: Auto-fetch (recommended)**

1. Open [instagram.com](https://www.instagram.com) and make sure you're logged in
2. Press **F12** → **Application** tab → **Cookies** → **https://www.instagram.com**
3. Copy the values of `sessionid`, `csrftoken`, and `ds_user_id`
4. Paste them on the Upload page and click **Fetch My Followers**

**Option B: Paste manually**

1. Open your profile on Instagram → click **Followers**
2. Scroll to the bottom to load everyone
3. Select all (Ctrl+A) and copy (Ctrl+C)
4. Paste into the Followers box on the Upload page
5. Repeat for **Following**

### 3. Analyze & unfollow

- Go to the **Analysis** page to see who doesn't follow you back
- Select users and click **Unfollow Selected** to batch unfollow (requires session cookie import)
- Use **Copy Selected** to copy profile links for manual review

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router)
- TypeScript
- [Tailwind CSS v4](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Lucide Icons](https://lucide.dev)

## Project Structure

```
app/
  page.tsx                  # Dashboard
  upload/page.tsx           # Data import (session cookie / paste)
  diff/page.tsx             # Follower analysis with unfollow
  history/page.tsx          # Snapshot history
  api/
    fetch-session/route.ts  # Fetch via session cookie
    paste/route.ts          # Parse pasted usernames
    upload/route.ts         # JSON file upload
    unfollow/route.ts       # Batch unfollow
    snapshots/route.ts      # List snapshots
    diff/route.ts           # Compute diffs
    logout/route.ts         # Clear all data
components/
  nav.tsx                   # Navigation bar with logout
  session-import.tsx        # Session cookie input form
  paste-import.tsx          # Paste usernames form
  user-table.tsx            # User list with select/filter/unfollow
  stats-card.tsx            # Dashboard stat card
lib/
  types.ts                  # TypeScript types
  instagram-parser.ts       # Parse Instagram export format
  storage.ts                # JSON file-based snapshot storage
  diff.ts                   # Follower diff computation
data/                       # Local snapshots (gitignored)
```

## Privacy

All data stays on your machine. Session cookies are stored in your browser's localStorage and are only sent directly to Instagram. No third-party services, no cloud storage.
