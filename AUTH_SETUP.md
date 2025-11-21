# Authentication Setup Guide

This guide will help you set up Google OAuth authentication for the Lingotribe Transcription Enhancer extension.

## 📋 Prerequisites

1. A Google Cloud Platform account
2. Chrome extension published or in development mode
3. List of authorized user emails

## 🔧 Setup Steps

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your Project ID

### Step 2: Enable Google+ API

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google+ API"
3. Click **Enable**

### Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Select **Chrome App** as the application type
4. For **Application ID**, enter your Chrome extension ID:
   - If published: Use the ID from Chrome Web Store
   - If in development: Get it from `chrome://extensions/` (enable Developer mode)
5. Click **Create**
6. Copy the **Client ID** (it will look like: `xxxxx.apps.googleusercontent.com`)

### Step 4: Update manifest.json

1. Open `manifest.json`
2. Replace `YOUR_CLIENT_ID` with your actual Client ID:

```json
"oauth2": {
  "client_id": "YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com",
  "scopes": [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile"
  ]
}
```

### Step 5: Configure Authorized Users

You have **3 options** for managing authorized users:

#### Option 1: Hardcoded List (Simplest)

Edit `auth.js`, find the `getAuthorizedEmails()` function:

```javascript
async getAuthorizedEmails() {
  return [
    'user1@gmail.com',
    'user2@example.com',
    'admin@company.com',
    // Add more emails here
  ];
}
```

**Pros:** Simple, no backend needed
**Cons:** Requires extension update to add/remove users

#### Option 2: Backend API (Recommended)

1. Create a backend API endpoint (Node.js, Python, PHP, etc.)
2. Store authorized emails in a database
3. Update `auth.js`:

```javascript
async getAuthorizedEmails() {
  try {
    const response = await fetch('https://your-backend.com/api/authorized-users');
    const data = await response.json();
    return data.emails || [];
  } catch (error) {
    console.error('Failed to fetch authorized emails:', error);
    return [];
  }
}
```

**Example Backend (Node.js + Express):**

```javascript
app.get('/api/authorized-users', (req, res) => {
  // Fetch from database
  const emails = db.getAuthorizedEmails();
  res.json({ emails });
});

app.post('/api/check-authorization', (req, res) => {
  const { email } = req.body;
  const isAuthorized = db.isEmailAuthorized(email);
  res.json({ authorized: isAuthorized });
});
```

#### Option 3: Firebase (Best for Real-time)

1. Create a Firebase project
2. Set up Firestore database
3. Create a collection `authorized_users`
4. Update `auth.js`:

```javascript
// Add Firebase SDK to your extension
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  // ... other config
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async getAuthorizedEmails() {
  const snapshot = await getDocs(collection(db, 'authorized_users'));
  return snapshot.docs.map(doc => doc.data().email);
}

async verifyUser(email) {
  const q = query(
    collection(db, 'authorized_users'),
    where('email', '==', email.toLowerCase())
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}
```

### Step 6: Test the Authentication

1. Load the extension in Chrome
2. Open the extension popup or options page
3. Click "Sign in with Google"
4. Authorize the extension
5. Verify that only authorized emails can access the extension

## 🔒 Security Best Practices

1. **Use HTTPS** for all backend API calls
2. **Validate tokens** on the backend if using Option 2/3
3. **Rate limit** authentication attempts
4. **Log** all authentication attempts
5. **Periodic checks** - The extension checks authorization every 5 minutes
6. **Revoke access** - Remove users from the authorized list to revoke access

## 🚀 How It Works

1. User clicks "Sign in with Google"
2. Chrome Identity API opens Google OAuth flow
3. User authorizes the extension
4. Extension receives OAuth token
5. Extension fetches user's email from Google API
6. Extension checks if email is in authorized list
7. If authorized, user can use the extension
8. Extension periodically re-checks authorization (every 5 minutes)

## 📝 Managing Users

### Add a User
- **Option 1:** Add email to `auth.js` and update extension
- **Option 2/3:** Add email to backend/Firebase (no extension update needed)

### Remove a User
- **Option 1:** Remove email from `auth.js` and update extension
- **Option 2/3:** Remove email from backend/Firebase (takes effect within 5 minutes)

## 🐛 Troubleshooting

### "Sign-in failed" Error
- Check that Client ID in manifest.json is correct
- Verify Google+ API is enabled
- Check browser console for detailed errors

### "User not authorized" Error
- Verify the email is in the authorized list
- Check spelling/case of email address
- Ensure backend API is accessible (if using Option 2/3)

### Extension ID Changed
- Update OAuth credentials in Google Cloud Console
- Use the new extension ID

## 📚 Additional Resources

- [Chrome Identity API Documentation](https://developer.chrome.com/docs/extensions/reference/identity/)
- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Firebase Authentication](https://firebase.google.com/docs/auth)

## 🎯 Quick Start (For Testing)

1. Get your extension ID from `chrome://extensions/`
2. Create OAuth credentials with that ID
3. Update `manifest.json` with Client ID
4. Add your email to `auth.js` in `getAuthorizedEmails()`
5. Reload extension
6. Test sign-in

## 💡 Tips

- Start with **Option 1** (hardcoded) for testing
- Move to **Option 2** or **3** for production
- Keep the authorized list small for better performance
- Use environment variables for sensitive data
- Consider adding role-based access control (admin, user, etc.)

---

**Need Help?** Check the GitHub repository or contact the developers.
