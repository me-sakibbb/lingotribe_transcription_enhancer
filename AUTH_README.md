# 🔐 Authentication System for Lingotribe Transcription Enhancer

## Overview

This authentication system ensures that only authorized users can use the Lingotribe Transcription Enhancer Chrome extension. It uses **Google OAuth 2.0** via the Chrome Identity API.

## 🎯 Features

- ✅ **Google Sign-In** - Secure OAuth 2.0 authentication
- ✅ **Email Whitelist** - Only authorized emails can use the extension
- ✅ **Periodic Verification** - Checks authorization every 5 minutes
- ✅ **Auto-Revocation** - Removes access when user is removed from whitelist
- ✅ **Multiple Backend Options** - Hardcoded list, API, or Firebase
- ✅ **Beautiful UI** - Professional login page with user info display

## 📁 Files Added

| File | Purpose |
|------|---------|
| `auth.js` | Core authentication manager |
| `login.html` | Login page UI |
| `login.js` | Login page logic |
| `AUTH_SETUP.md` | Detailed setup instructions |
| `example-backend.js` | Example Node.js backend API |

## 🚀 Quick Start

### 1. Get OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project and enable Google+ API
3. Create OAuth 2.0 credentials (Chrome App type)
4. Copy the Client ID

### 2. Update manifest.json

Replace `YOUR_CLIENT_ID` with your actual Client ID:

```json
"oauth2": {
  "client_id": "123456789.apps.googleusercontent.com",
  "scopes": [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile"
  ]
}
```

### 3. Add Authorized Users

Edit `auth.js`, find `getAuthorizedEmails()`:

```javascript
async getAuthorizedEmails() {
  return [
    'your-email@gmail.com',
    'team-member@company.com',
    // Add more emails here
  ];
}
```

### 4. Test

1. Load the extension in Chrome
2. Visit any webpage
3. You'll see an authentication prompt
4. Click "Sign In with Google"
5. Authorize the extension
6. If your email is in the list, you can use the extension!

## 🔧 How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    User Opens Webpage                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              content.js Loads & Checks Auth                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                    ┌────┴────┐
                    │         │
                    ▼         ▼
            ┌──────────┐  ┌──────────┐
            │   Yes    │  │    No    │
            │Authorized│  │Show Login│
            └────┬─────┘  └────┬─────┘
                 │             │
                 ▼             ▼
         ┌──────────────┐  ┌──────────────┐
         │Extension     │  │User Signs In │
         │Works Normally│  │with Google   │
         └──────────────┘  └──────┬───────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │Check Email in   │
                         │Authorized List  │
                         └────────┬────────┘
                                  │
                             ┌────┴────┐
                             │         │
                             ▼         ▼
                      ┌──────────┐  ┌──────────┐
                      │ Granted  │  │ Denied   │
                      └──────────┘  └──────────┘
```

## 🎨 User Experience

### Unauthenticated User
1. Opens a webpage
2. Sees a full-screen overlay with "Authentication Required"
3. Clicks "Sign In with Google"
4. Redirected to login page
5. Signs in with Google
6. If authorized: overlay disappears, extension works
7. If not authorized: sees "User not authorized" error

### Authenticated User
1. Opens a webpage
2. Extension works immediately (no prompts)
3. All features available

### Revoked User
1. Using the extension normally
2. Admin removes their email from authorized list
3. Within 5 minutes: sees "Access revoked" message
4. Extension stops working
5. Must sign in again (will be denied)

## 🔒 Security Features

1. **OAuth 2.0** - Industry-standard authentication
2. **Token Validation** - Verifies Google tokens
3. **Periodic Checks** - Re-validates every 5 minutes
4. **Secure Storage** - Uses Chrome's secure storage
5. **HTTPS Only** - All API calls use HTTPS (in production)
6. **No Password Storage** - Uses Google's authentication

## 📊 Authorization Options

### Option 1: Hardcoded List (Simplest)
- **Pros**: No backend needed, simple setup
- **Cons**: Requires extension update to change users
- **Best for**: Small teams, testing

### Option 2: Backend API (Recommended)
- **Pros**: Dynamic user management, no extension updates
- **Cons**: Requires backend server
- **Best for**: Production use, larger teams

### Option 3: Firebase (Best)
- **Pros**: Real-time updates, no server management, scalable
- **Cons**: Requires Firebase setup
- **Best for**: Production use, any team size

## 🛠️ Managing Users

### Add a User

**Option 1 (Hardcoded):**
```javascript
// In auth.js
async getAuthorizedEmails() {
  return [
    'existing@gmail.com',
    'new-user@gmail.com', // Add this line
  ];
}
```
Then update the extension.

**Option 2 (Backend API):**
```bash
curl -X POST https://your-api.com/api/admin/add-user \
  -H "Content-Type: application/json" \
  -d '{"email":"new-user@gmail.com","adminKey":"YOUR_KEY"}'
```

**Option 3 (Firebase):**
```javascript
// In Firebase Console or via code
db.collection('authorized_users').add({
  email: 'new-user@gmail.com',
  addedAt: new Date()
});
```

### Remove a User

Same as above, but use remove endpoints/methods.

## 📝 Customization

### Change Check Interval

In `auth.js`, find `startPeriodicCheck()`:

```javascript
// Change from 5 minutes to 10 minutes
this.checkInterval = setInterval(async () => {
  // ...
}, 10 * 60 * 1000); // 10 minutes
```

### Customize Login Page

Edit `login.html` and `login.js` to match your branding.

### Add Role-Based Access

Extend the auth system to support different roles:

```javascript
async verifyUser(email) {
  const user = await this.getUserFromDatabase(email);
  return {
    authorized: user !== null,
    role: user?.role || 'user',
    permissions: user?.permissions || []
  };
}
```

## 🐛 Troubleshooting

### "Auth manager not loaded"
- Check that `auth.js` is listed before `content.js` in manifest.json
- Reload the extension

### "User not authorized"
- Verify email is in the authorized list
- Check for typos in email address
- Ensure backend API is accessible

### "Sign-in failed"
- Check Client ID in manifest.json
- Verify Google+ API is enabled
- Check browser console for errors

## 📚 Additional Resources

- [Chrome Identity API](https://developer.chrome.com/docs/extensions/reference/identity/)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Full Setup Guide](./AUTH_SETUP.md)

## 💡 Tips

- Test with your own email first
- Use environment variables for sensitive data
- Monitor authentication logs
- Set up alerts for failed auth attempts
- Keep the authorized list small for better performance

## 🎯 Next Steps

1. Follow the setup guide in `AUTH_SETUP.md`
2. Choose your authorization method (hardcoded/API/Firebase)
3. Test with a few users
4. Deploy to production
5. Monitor and maintain the user list

---

**Need Help?** Check `AUTH_SETUP.md` for detailed instructions or contact the developers.
