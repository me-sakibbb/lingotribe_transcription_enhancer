# LingoTribe Transcription Enhancer

A powerful Chrome extension designed to enhance text input with automatic corrections, formatting, and transcription cleanup features. Perfect for transcriptionists, writers, and anyone who wants to streamline their text editing workflow.

## ✨ Features

### 🔤 Text Shortcuts
- Create custom text expansions that trigger when you type a shortcut and press Space
- Example: Type `brb` + Space → automatically expands to "be right back"
- Perfect for frequently used phrases, email addresses, or special characters

### 🔧 Word Replacements (Alt+R)
- Automatically fix common typos and misspellings
- Press `Alt+R` to apply all replacements to the current text field
- Smart word-boundary detection ensures accurate replacements
- Examples:
  - `teh` → `the`
  - `dont` → `don't`
  - `cant` → `can't`

### 🎨 Formatting Rules (Alt+F)
Apply professional formatting with one keystroke:
- Auto-capitalize sentences
- Remove double spaces
- Add single space after punctuation
- Apply smart quotes
- Remove unwanted filler words (e.g., `[um]`, `[inhale]`, `[exhale]`)
- Clean text inside brackets (lowercase, remove punctuation)

### 🔢 Number Conversion (Alt+N)
- Convert word numbers to digits throughout your text
- Supports: zero through nineteen, twenty, thirty, forty, fifty, sixty, seventy, eighty, ninety, hundred, thousand
- Examples:
  - "I have one apple, two oranges" → "I have 1 apple, 2 oranges"
  - "Chapter one discusses ten points" → "Chapter 1 discusses 10 points"

### ⚡ Apply All Transformations (Alt+A)
The ultimate power shortcut that combines everything:
1. **Step 1:** Word replacements (fixes typos)
2. **Step 2:** Number conversion (words to digits)
3. **Step 3:** Formatting (cleanup and polish)

**Example:**
- **Before:** `teh meeting has one hundred attendees[um]dont forget to email them`
- **After:** `The meeting has 100 attendees. Don't forget to email them`

### 📝 Floating Word Picker (Alt+P)
- Quick-access floating window with frequently used words/phrases
- Click any item to insert it at your cursor position
- Customizable list for your specific needs
- Great for technical terms, common responses, or special characters

## 🚀 Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Select the extension folder
6. The extension is now installed and ready to use!

## ⚙️ Configuration

1. Click the extension icon in your browser toolbar
2. Click "Settings" to open the configuration page
3. Customize your shortcuts, replacements, and formatting rules
4. Add words to remove and configure number conversion
5. Click "Save Settings" to apply your changes

## 🎯 Keyboard Shortcuts

| Shortcut | Function |
|----------|----------|
| `Alt+R` | Apply word replacements to current text |
| `Alt+F` | Apply all formatting rules |
| `Alt+N` | Convert word numbers to digits |
| `Alt+A` | Apply ALL transformations (R + N + F combined) |
| `Alt+P` | Show/hide floating word picker |

## 💡 Use Cases

### For Transcriptionists
- Quickly remove audio cues: `[inhale]`, `[exhale]`, `[cough]`
- Fix common transcription typos
- Format text professionally with one keystroke
- Convert written-out numbers to digits

### For Writers
- Auto-correct common typos as you type
- Maintain consistent formatting
- Use text shortcuts for frequently used phrases
- Quick access to special characters or technical terms

### For Data Entry
- Expand abbreviations automatically
- Standardize text formatting
- Speed up repetitive text input
- Ensure consistency across entries

## 🛠️ Technical Details

- **Manifest Version:** 3
- **Permissions:** activeTab, storage
- **Works on:** All websites
- **Browser:** Chrome (and Chromium-based browsers)

## 🔒 Privacy

This extension:
- Stores all settings locally in your browser (chrome.storage.sync)
- Does NOT send any data to external servers
- Only accesses text in input fields when you trigger a shortcut
- Operates completely offline after installation

## 🎭 How It Works

The extension uses keyboard event simulation to make changes, ensuring that websites detect the modifications as if you typed them manually. This provides maximum compatibility with web applications, form validation, and auto-save features.

## 📋 File Structure

```
├── manifest.json          # Extension configuration
├── background.js          # Background service worker
├── content.js            # Main content script (text manipulation logic)
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── options.html          # Settings page
├── options.js            # Settings page functionality
└── README.md             # This file
```

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs or issues
- Suggest new features
- Submit pull requests
- Improve documentation

## 📝 License

MIT License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2025 me-sakibbb

## 🙏 Acknowledgments

Created for LingoTribe transcription workflow optimization.

---

**Version:** 1.0.0  
**Last Updated:** November 2025

For support or questions, please open an issue in the repository.
