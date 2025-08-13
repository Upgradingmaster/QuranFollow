// Background script to handle extension icon clicks and open side panel

chrome.action.onClicked.addListener(async (tab) => {
  // Open the side panel when extension icon is clicked
  await chrome.sidePanel.open({ windowId: tab.windowId });
});