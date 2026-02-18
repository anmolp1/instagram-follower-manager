// Background service worker: receives unfollow requests from the content
// script and injects the unfollow logic into an instagram.com tab.

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action !== "unfollow") return;
  handleUnfollow(msg.usernames);
});

async function handleUnfollow(usernames) {
  // Find an existing instagram.com tab or create one
  const tabs = await chrome.tabs.query({ url: "https://www.instagram.com/*" });
  let tab;

  if (tabs.length > 0) {
    tab = tabs[0];
    await chrome.tabs.update(tab.id, { active: true });
  } else {
    tab = await chrome.tabs.create({ url: "https://www.instagram.com/" });
    // Wait for the page to finish loading
    await new Promise((resolve) => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === tab.id && info.status === "complete") {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      });
    });
  }

  // Inject the unfollow function into the instagram.com tab
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: runUnfollow,
    args: [usernames],
  });
}

// This function is serialized and injected into the instagram.com page context.
function runUnfollow(usernames) {
  // Prevent running multiple times simultaneously
  if (window.__igUnfollowRunning) {
    alert("An unfollow batch is already running. Wait for it to finish.");
    return;
  }
  window.__igUnfollowRunning = true;

  (async () => {
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    let success = 0;
    let fail = 0;

    for (let i = 0; i < usernames.length; i++) {
      const u = usernames[i];
      console.log(`[${i + 1}/${usernames.length}] Unfollowing ${u}...`);
      try {
        const res = await fetch(
          `https://www.instagram.com/api/v1/web/friendships/${u}/unfollow/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "X-CSRFToken":
                document.cookie.match(/csrftoken=([^;]+)/)?.[1] || "",
              "X-Requested-With": "XMLHttpRequest",
              "X-Instagram-AJAX": "1",
            },
            credentials: "include",
          }
        );
        if (res.ok) {
          success++;
          console.log(`  ✓ Unfollowed ${u}`);
        } else {
          fail++;
          console.warn(`  ✗ Failed ${u} (${res.status})`);
          if (res.status === 429) {
            console.warn("  Rate limited! Waiting 5 minutes...");
            await delay(300000);
          }
        }
      } catch (e) {
        fail++;
        console.warn(`  ✗ Error ${u}:`, e.message);
      }
      // Wait 20-30s between unfollows to stay under rate limits
      if (i < usernames.length - 1) {
        const wait = 20000 + Math.random() * 10000;
        console.log(`  Waiting ${Math.round(wait / 1000)}s...`);
        await delay(wait);
      }
    }

    window.__igUnfollowRunning = false;
    console.log(`Done! ✓ ${success} unfollowed, ✗ ${fail} failed`);
    alert(`Unfollow complete!\n✓ ${success} unfollowed\n✗ ${fail} failed`);
  })();
}
