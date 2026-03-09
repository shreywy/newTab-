// Redirect about:home (Ctrl+N new window) to newTab+
// chrome_url_overrides.newtab handles about:newtab (Ctrl+T) already
const extUrl = browser.runtime.getURL('index.html');

browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url === 'about:home') {
    browser.tabs.update(tabId, { url: extUrl });
  }
});
