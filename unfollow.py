#!/usr/bin/env python3
"""
Instagram Bulk Unfollow Script

Usage:
  1. Export the unfollow list from the app (Analysis → Download Unfollow List)
  2. Get your Instagram session cookies from your browser:
     - Open instagram.com → F12 → Application → Cookies
     - Copy the values of: sessionid, csrftoken, ds_user_id
  3. Run:
     python unfollow.py unfollow_list.txt

  The script will prompt you for your cookies on first run and save them
  locally so you don't have to enter them again.
"""

import json
import os
import sys
import time
import random
import urllib.request
import urllib.error

COOKIE_FILE = ".ig_cookies.json"


def get_cookies():
    """Load saved cookies or prompt the user for them."""
    if os.path.exists(COOKIE_FILE):
        with open(COOKIE_FILE) as f:
            cookies = json.load(f)
            if cookies.get("sessionid") and cookies.get("csrftoken") and cookies.get("ds_user_id"):
                print(f"Using saved cookies (delete {COOKIE_FILE} to re-enter)")
                return cookies

    print("Enter your Instagram cookies (from browser DevTools → Application → Cookies):\n")
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
    print(f"\nCookies saved to {COOKIE_FILE}\n")

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
            print("    Rate limited! Waiting 5 minutes...")
            time.sleep(300)
            return unfollow_user(username, cookies)  # retry once
        print(f"    HTTP {e.code}: {e.reason}")
    except urllib.error.URLError as e:
        print(f"    Network error: {e.reason}")
    return False


def main():
    if len(sys.argv) < 2:
        print("Usage: python unfollow.py <unfollow_list.txt>")
        print("\nExport the list from the app: Analysis → Download Unfollow List")
        sys.exit(1)

    list_file = sys.argv[1]
    if not os.path.exists(list_file):
        print(f"File not found: {list_file}")
        sys.exit(1)

    with open(list_file) as f:
        usernames = [line.strip() for line in f if line.strip()]

    if not usernames:
        print("No usernames found in file")
        sys.exit(1)

    print(f"\nFound {len(usernames)} users to unfollow\n")

    cookies = get_cookies()

    success = 0
    fail = 0

    for i, username in enumerate(usernames):
        print(f"[{i + 1}/{len(usernames)}] Unfollowing {username}...", end=" ")
        if unfollow_user(username, cookies):
            success += 1
            print("✓")
        else:
            fail += 1
            print("✗")

        # Wait 20-30s between unfollows
        if i < len(usernames) - 1:
            wait = 20 + random.random() * 10
            print(f"    Waiting {wait:.0f}s...")
            time.sleep(wait)

    print(f"\nDone! ✓ {success} unfollowed, ✗ {fail} failed")


if __name__ == "__main__":
    main()
