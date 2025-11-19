// background.js
// Handles installation and default settings initialization.

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
  wordPickerItems: ["Sincerely,", "Best regards,", "Thank you,"],
  formatting: {
    autoCapitalize: true,
    smartQuotes: true,
    removeDoubleSpaces: true
  },
  enabled: true
};

chrome.runtime.onInstalled.addListener(() => {
  console.log("Text Enhancer Extension Installed");
  
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