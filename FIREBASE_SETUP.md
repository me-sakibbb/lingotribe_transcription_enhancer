# Firebase Setup Guide

## ✅ Firebase Integration Complete!

The extension now fetches authorized emails from Firebase Firestore instead of using a hardcoded list.

## 📋 Firebase Database Structure

Your Firestore database should have this structure:

```
lingotribe_transcription_enhancer (collection)
  └── approved_emails (document)
      └── emails (array field)
          ├── "sakibulhasan159@gmail.com"
          ├── "user2@example.com"
          └── "user3@example.com"
```

## 🔧 How to Set Up in Firebase Console

### 1. Go to Firebase Console
- Visit [Firebase Console](https://console.firebase.google.com/)
- Select your project: **anilab-42c99**

### 2. Create Firestore Database (if not already created)
- Click **Firestore Database** in the left menu
- Click **Create database**
- Choose **Start in production mode** or **Test mode**
- Select a location close to your users

### 3. Create the Collection and Document

**Step 1:** Create Collection
- Click **Start collection**
- Collection ID: `lingotribe_transcription_enhancer`
- Click **Next**

**Step 2:** Create Document
- Document ID: `approved_emails`
- Add field:
  - Field name: `emails`
  - Field type: **array**
  - Array values: Add email addresses one by one
    - `sakibulhasan159@gmail.com`
    - (Add more as needed)
- Click **Save**

### 4. Set Firestore Rules

Go to **Firestore Database** > **Rules** and add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to approved_emails for everyone
    // (The extension needs to read this to check authorization)
    match /lingotribe_transcription_enhancer/approved_emails {
      allow read: if true;
      allow write: if false; // Only you can write via Firebase Console
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Click **Publish**

## 📝 How to Add/Remove Users

### Option 1: Firebase Console (Recommended)
1. Go to Firestore Database
2. Navigate to `lingotribe_transcription_enhancer` > `approved_emails`
3. Click on the `emails` array field
4. Add or remove email addresses
5. Click **Update**
6. Changes take effect immediately (within 5 minutes for already signed-in users)

### Option 2: Programmatically (Advanced)
Use Firebase Admin SDK or Firestore REST API to update the emails array.

## 🧪 Testing

1. **Reload the extension** in Edge/Chrome
2. **Visit lingotribe.world**
3. **Check console** - you should see:
   ```
   [Firebase] Fetching authorized emails...
   [Firebase] Found X authorized emails
   [Auth] Loaded X authorized emails from Firebase
   ```
4. **Sign in** with an authorized email - should work!
5. **Sign in** with unauthorized email - should be rejected

## 🔄 How It Works

1. Extension loads `firebase-config.js`
2. Creates `firebaseHelper` instance
3. `auth.js` calls `firebaseHelper.getAuthorizedEmails()`
4. Firebase helper fetches from Firestore REST API
5. Returns array of emails
6. Auth manager checks if user's email is in the array

## 🛡️ Security Notes

- ✅ **Read-only access**: Extension can only READ emails, not write
- ✅ **No authentication needed**: Firestore rules allow public read for this specific document
- ✅ **Fail-safe**: If Firebase is down, falls back to hardcoded list
- ✅ **Real-time updates**: Changes in Firebase reflect within 5 minutes

## 📊 Current Configuration

**Firebase Project:** anilab-42c99
**Collection:** lingotribe_transcription_enhancer
**Document:** approved_emails
**Field:** emails (array)

**Fallback Email:** sakibulhasan159@gmail.com (used if Firebase is unavailable)

## 🚀 Next Steps

1. Set up the Firestore database structure as described above
2. Add your authorized emails to the `emails` array
3. Set the Firestore rules
4. Reload the extension
5. Test with authorized and unauthorized emails

---

**The extension will now fetch authorized emails from Firebase in real-time!** 🎉
