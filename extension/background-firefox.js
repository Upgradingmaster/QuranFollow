// Firefox background script to handle extension icon clicks and open sidebar

chrome.browserAction.onClicked.addListener(async (tab) => {
  // Open the sidebar when extension icon is clicked
  await chrome.sidebarAction.open();
});
