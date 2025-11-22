// background.js
// Handles installation and default settings initialization for Lingotribe Transcription Enhancer.

const DEFAULT_SETTINGS = {
  shortcuts: {
    "ch": "[chuckles]",
    "dr": "drawn out",
    "em": "emphasizes",
    "la": "[laughs]",
    "mh": "[mm-hmm]",
    "sg": "[sigh]",
    "sml": "[smacks lips]",
    "sp": "[short pause]"
  },
  replacements: {
    "Hmm": "[hmm]",
    "Mm-hmm": "[mm-hmm]",
    "cant": "can't",
    "dont": "don't",
    "mhm": "[mhm]",
    "teh": "the"
  },
  removedWords: ["literally", "basically"],
  formattingRemovedWords: [
    "[inhale]",
    "[exhale]",
    "[inhales]",
    "[exhales]",
    "[breathing]",
    "[breathes in]",
    "[breathes out]",
    "[breaths in]",
    "[breaths out]",
    "[mount noises]"
  ],
  wordPickerItems: [
    "[uh]",
    "[um]",
    "[uh-huh]",
    "[mm-hmm]",
    "[short pause]",
    "[hmm]",
    "[chuckle]",
    "Okay.",
    "Yeah."
  ],
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