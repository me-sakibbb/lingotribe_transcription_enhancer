# Google OAuth Setup Guide for Edge/Chrome Extension

## Quick Setup Steps

### Step 1: Get Your Extension ID

1. Open Edge: `edge://extensions/` (or Chrome: `chrome://extensions/`)
2. Enable **Developer mode** (toggle in top right)
3. Find **Lingotribe Transcription Enhancer**
4. Copy the **ID** (looks like: `abcdefghijklmnop`)
5. **IMPORTANT:** Save this ID, you'll need it!

### Step 2: Create Web Application OAuth Client

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one)
3. Go to **APIs & Services** > **Credentials**
4. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
5. Choose **Web application** (NOT Chrome App!)
6. Name it: `Lingotribe Extension`

### Step 3: Configure Redirect URIs

In the **Authorized redirect URIs** section, add:

```
https://YOUR_EXTENSION_ID.chromiumapp.org/
```

**Example:** If your extension ID is `abcdefghijklmnop`, add:
```
https://abcdefghijklmnop.chromiumapp.org/
```

**Important Notes:**
- Replace `YOUR_EXTENSION_ID` with your actual extension ID from Step 1
- Include the trailing slash `/`
- Use `https://` not `http://`
- Use `.chromiumapp.org` (this works for both Chrome and Edge)

### Step 4: Save and Get Client ID

1. Click **CREATE**
2. Copy the **Client ID** (looks like: `123456789-abc123.apps.googleusercontent.com`)
3. You can ignore the Client Secret for now

### Step 5: Update Extension Code

After you get the new Client ID, tell me and I'll update the code with it.

Or you can update it yourself in `login.js` line 5:

```javascript
const GOOGLE_CLIENT_ID = 'YOUR_NEW_CLIENT_ID_HERE.apps.googleusercontent.com';
```

## Troubleshooting

### "Can't find Authorized redirect URIs"

Make sure you selected **Web application** not **Chrome App**. Only Web application has the redirect URIs field.

### "redirect_uri_mismatch" error

Double-check:
1. Extension ID is correct (from `edge://extensions/`)
2. Redirect URI in Google Console matches exactly: `https://YOUR_ID.chromiumapp.org/`
3. Trailing slash `/` is included
4. No typos in the extension ID

### Extension ID keeps changing

This happens in development mode. Solutions:
1. **Best:** Publish to Chrome Web Store (unpublished/private) - ID stays permanent
2. **Alternative:** Pack the extension (creates a .crx file with fixed ID)
3. **Quick fix:** Update redirect URI each time ID changes

## Example Configuration

**Extension ID:** `abcdefghijklmnop`

**Redirect URI to add in Google Console:**
```
https://abcdefghijklmnop.chromiumapp.org/
```

**Client ID you'll get:**
```
123456789-abc123def456.apps.googleusercontent.com
```

**Update in login.js:**
```javascript
const GOOGLE_CLIENT_ID = '123456789-abc123def456.apps.googleusercontent.com';
```

## Next Steps

1. Complete Steps 1-4 above
2. Share your new Client ID with me
3. I'll update the code
4. Reload extension and test!

---

**Need Help?** Share a screenshot of the Google Cloud Console OAuth client creation page and I can guide you through it!
