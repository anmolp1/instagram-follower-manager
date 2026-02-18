// Content script: runs on the Instagram Follower Manager web app.
// Signals to the app that the extension is installed, and forwards
// unfollow requests to the background service worker.

// Let the app know the extension is available
document.documentElement.setAttribute("data-ig-extension", "true");

window.addEventListener("ig-unfollow", (e) => {
  const usernames = e.detail?.usernames;
  if (!Array.isArray(usernames) || usernames.length === 0) return;

  chrome.runtime.sendMessage({ action: "unfollow", usernames });
});
