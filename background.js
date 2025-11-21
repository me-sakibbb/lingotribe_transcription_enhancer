// background.js
// Handles installation and default settings initialization for Lingotribe Transcription Enhancer.

const DEFAULT_SETTINGS = {
  shortcuts: {
    "brb": "be right back",
    "omw": "on my way",
    "email": "user@example.com",
    "shrug": "¯\\_(ツ)_/¯",
    "sp": "[short pause]"
  },
  replacements: {
    "brb": "be right back",
    "omw": "on my way",
    "teh": "the",
    "dont": "don't",
    "cant": "can't"
  },
  removedWords: ["literally", "basically"],
  formattingRemovedWords: ["[inhale]", "[exhale]", "[um]", "[uh]", "[hmm]"],
  wordPickerItems: ["Sincerely,", "Best regards,", "Thank you,"],
  formatting: {
    autoCapitalize: true,
    smartQuotes: true,
    removeDoubleSpaces: true,
    spaceAfterPunctuation: true,
    removeWords: true,
    convertWordNumbers: true
  },
  enabled: true
};

chrome.runtime.onInstalled.addListener(() => {
  console.log("Lingotribe Transcription Enhancer Installed");

  // Initialize settings if they don't exist
  chrome.storage.sync.get(null, (items) => {
    const newSettings = {};
    let needsUpdate = false;

    if (Object.keys(items).length === 0) {
      Object.assign(newSettings, DEFAULT_SETTINGS);
      needsUpdate = true;
    } else {
      // Check for missing keys in case of update
      for (const key in DEFAULT_SETTINGS) {
        if (items[key] === undefined) {
          newSettings[key] = DEFAULT_SETTINGS[key];
          needsUpdate = true;
        }
      }
    }

    if (needsUpdate) {
      chrome.storage.sync.set(newSettings);
    }
  });
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OPEN_LOGIN_PAGE') {
    // Open login page in a new tab
    chrome.tabs.create({
      url: chrome.runtime.getURL('login.html')
    });
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'AUTH_REVOKED') {
    // Broadcast to all tabs
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, message).catch(() => {
          // Ignore errors for tabs that don't have content script
        });
      });
    });
    return true;
  }
});