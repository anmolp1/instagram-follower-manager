#!/usr/bin/env python3
"""
Instagram Unfollow Server

Run this once:
  python unfollow.py

It starts a local server on port 5123. The web app sends unfollow
requests to it directly — just click the button in the app.

First run will prompt for your Instagram cookies.
"""

import json
import os
import sys
import time
import random
import threading
import urllib.request
import urllib.error
from http.server import HTTPServer, BaseHTTPRequestHandler

PORT = 5123
COOKIE_FILE = ".ig_cookies.json"


def get_cookies():
    """Load saved cookies or prompt the user for them."""
    if os.path.exists(COOKIE_FILE):
        with open(COOKIE_FILE) as f:
            cookies = json.load(f)
            if cookies.get("sessionid") and cookies.get("csrftoken") and cookies.get("ds_user_id"):
                print(f"  Using saved cookies (delete {COOKIE_FILE} to re-enter)")
                return cookies

    print("\nEnter your Instagram cookies (from browser DevTools → Application → Cookies):\n")
    sessionid = input("  sessionid: ").strip()
    csrftoken = input("  csrftoken: ").strip()
    ds_user_id = input("  ds_user_id: ").strip()

    cookies = {
        "sessionid": sessionid,
        "csrftoken": csrftoken,
        "ds_user_id": ds_user_id,
    }

    with open(COOKIE_FILE, "w") as f:
        json.dump(cookies, f)
    print(f"\n  Cookies saved to {COOKIE_FILE}\n")

    return cookies


def unfollow_user(username, cookies):
    """Unfollow a single user. Returns True on success."""
    url = f"https://www.instagram.com/api/v1/web/friendships/{username}/unfollow/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Content-Type": "application/x-www-form-urlencoded",
        "X-CSRFToken": cookies["csrftoken"],
        "X-Requested-With": "XMLHttpRequest",
        "X-Instagram-AJAX": "1",
        "Referer": f"https://www.instagram.com/{username}/",
        "Origin": "https://www.instagram.com",
        "Cookie": f"sessionid={cookies['sessionid']}; csrftoken={cookies['csrftoken']}; ds_user_id={cookies['ds_user_id']}",
    }

    req = urllib.request.Request(url, data=b"", headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as res:
            if res.status == 200:
                return True
    except urllib.error.HTTPError as e:
        if e.code == 429:
            print("      Rate limited! Waiting 5 minutes...")
            time.sleep(300)
            return unfollow_user(username, cookies)
        print(f"      HTTP {e.code}: {e.reason}")
    except urllib.error.URLError as e:
        print(f"      Network error: {e.reason}")
    return False


def run_unfollow_batch(usernames, cookies):
    """Run unfollows in the background."""
    success = 0
    fail = 0

    for i, username in enumerate(usernames):
        print(f"  [{i + 1}/{len(usernames)}] Unfollowing {username}...", end=" ")
        if unfollow_user(username, cookies):
            success += 1
            print("✓")
        else:
            fail += 1
            print("✗")

        if i < len(usernames) - 1:
            wait = 20 + random.random() * 10
            print(f"      Waiting {wait:.0f}s...")
            time.sleep(wait)

    print(f"\n  Done! ✓ {success} unfollowed, ✗ {fail} failed\n")


class UnfollowHandler(BaseHTTPRequestHandler):
    cookies = None

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors_headers()
        self.end_headers()

    def do_GET(self):
        """Health check endpoint."""
        self.send_response(200)
        self._cors_headers()
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"status": "ready"}).encode())

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)

        try:
            data = json.loads(body)
            usernames = data.get("usernames", [])
        except (json.JSONDecodeError, AttributeError):
            self.send_response(400)
            self._cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Invalid JSON"}).encode())
            return

        if not usernames:
            self.send_response(400)
            self._cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "No usernames provided"}).encode())
            return

        print(f"\n  Received request to unfollow {len(usernames)} user(s)")

        # Start unfollowing in background thread
        thread = threading.Thread(
            target=run_unfollow_batch,
            args=(usernames, self.cookies),
            daemon=True,
        )
        thread.start()

        # Return immediately
        self.send_response(200)
        self._cors_headers()
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(
            json.dumps({"started": True, "count": len(usernames)}).encode()
        )

    def _cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def log_message(self, format, *args):
        pass  # Suppress default HTTP logging


def main():
    cookies = get_cookies()
    UnfollowHandler.cookies = cookies

    server = HTTPServer(("127.0.0.1", PORT), UnfollowHandler)
    print(f"\n  Unfollow server running on http://localhost:{PORT}")
    print(f"  Click 'Unfollow' in the app — it will just work.\n")
    print(f"  Press Ctrl+C to stop.\n")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Server stopped.")
        server.server_close()


if __name__ == "__main__":
    main()
