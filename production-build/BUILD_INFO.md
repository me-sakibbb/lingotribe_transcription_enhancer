# Production Build - Lingotribe Transcription Enhancer

## 📦 Build Information

**Build Date:** ${new Date().toISOString()}
**Version:** 2.1.0
**Status:** Production Ready - Fully Obfuscated

## 🔒 Security Features

This production build includes maximum code protection:

### Obfuscation Techniques Applied:
1. **Control Flow Flattening** (75% threshold)
   - Makes code execution flow extremely difficult to follow
   
2. **Dead Code Injection** (40% threshold)
   - Adds fake code paths that are never executed
   
3. **Debug Protection**
   - Prevents debugging in DevTools
   - Auto-refreshes every 2 seconds if debugger is detected
   
4. **Self-Defending Code**
   - Code that detects and prevents tampering
   
5. **String Array Encoding**
   - All strings are encoded in base64 and stored in shuffled arrays
   - String array rotation and shuffling
   - Wrapped in multiple layers of functions
   
6. **Identifier Obfuscation**
   - All variable and function names converted to hexadecimal
   
7. **Number to Expression Conversion**
   - Numbers converted to complex mathematical expressions
   
8. **Object Keys Transformation**
   - Object property names are obfuscated

### File Size Comparison:
- **auth.js**: 7KB → 62KB (8.8x increase)
- **background.js**: 2KB → 42KB (21x increase)
- **content.js**: 48KB → 344KB (7.2x increase)
- **firebase-config.js**: 4KB → 42KB (10.5x increase)
- **login.js**: 7KB → 85KB (12.1x increase)
- **options.js**: 7KB → 118KB (16.9x increase)
- **popup.js**: 3KB → 58KB (19.3x increase)

## 📂 Directory Structure

```
production-build/
├── auth.js                 (obfuscated)
├── background.js           (obfuscated)
├── content.js              (obfuscated)
├── firebase-config.js      (obfuscated)
├── login.js                (obfuscated)
├── options.js              (obfuscated)
├── popup.js                (obfuscated)
├── login.html
├── oauth-callback.html
├── options.html
├── popup.html
├── manifest.json
├── LICENSE
└── README.md
```

## 🚀 Installation Instructions

### For Chrome:
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `production-build` folder

### For Edge:
1. Open Edge and navigate to `edge://extensions/`
2. Enable "Developer mode" (toggle in left sidebar)
3. Click "Load unpacked"
4. Select the `production-build` folder

## ⚠️ Important Notes

1. **Source Code Protection**: All JavaScript files are heavily obfuscated. Attempting to reverse-engineer will be extremely difficult and time-consuming.

2. **Performance**: Due to obfuscation, there may be a slight performance overhead. This is normal and expected.

3. **Debugging**: The obfuscated code includes anti-debugging measures. If you need to debug, use the development version instead.

4. **Updates**: To update the extension, replace the entire `production-build` folder with a new build.

5. **Distribution**: This build is ready for distribution. The source code is protected from casual inspection and modification.

## 🛠️ Rebuilding

To create a new production build:

```bash
cd "c:\Users\ASUS\Documents\My Programming\Projects\LT automation"
node build-production.js
```

This will regenerate all obfuscated files in the `production-build` directory.

## 📋 Manifest Details

- **Name**: Lingotribe Transcription Enhancer
- **Version**: 2.1.0
- **Permissions**: storage, activeTab, scripting, identity
- **OAuth2 Client ID**: Configured for Google Sign-In
- **Content Scripts**: Runs on `*://*.lingotribe.world/*`

## 🔐 Authentication

The extension uses Firebase Authentication with Google OAuth2. Only authorized email addresses can use the extension.

## 📄 License

See LICENSE file for details.

## 👥 Authors

Created by **me-sakibbb** & **NuhalMunawar**

## 🔗 Links

- GitHub: https://github.com/me-sakibbb/lingotribe_transcription_enhancer
- Support: Contact the authors for any issues

---

**Note**: This is a production build with maximum code protection. The source code is intentionally obfuscated to prevent unauthorized access and modification.
