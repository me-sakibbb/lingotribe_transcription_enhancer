# Setting Up Private Source + Public Distribution

This guide shows you how to maintain your source code privately while distributing the production build publicly.

## 🎯 Repository Structure

```
Private Repo (this one)          Public Repo (for users)
├── auth.js                      ├── auth.js (obfuscated)
├── content.js                   ├── content.js (obfuscated)
├── firebase-config.js           ├── firebase-config.js (obfuscated)
├── build-production.js          ├── manifest.json
├── production-build/            ├── LICENSE
│   └── (obfuscated files)       ├── README.md
└── ...                          └── ...
```

## 📋 Setup Instructions

### Step 1: Create Public Repository on GitHub

1. Go to https://github.com/new
2. Create a new repository:
   - **Name**: `lingotribe-transcription-enhancer` (or your preferred name)
   - **Visibility**: ✅ **Public**
   - **Description**: "Professional transcription enhancement Chrome extension"
   - Don't initialize with README (we'll add it automatically)

3. Copy the repository URL (e.g., `https://github.com/yourusername/lingotribe-transcription-enhancer.git`)

### Step 2: Clone Public Repository Locally

Open terminal and run:

```bash
cd "c:\Users\ASUS\Documents\My Programming\Projects"
git clone https://github.com/yourusername/lingotribe-transcription-enhancer.git lingotribe-extension-public
```

This creates the public repo folder next to your private one:
```
Projects/
├── LT automation/              (Private - your source code)
└── lingotribe-extension-public/ (Public - for distribution)
```

### Step 3: Update Sync Script Configuration

Edit `sync-to-public.js` if your public repo has a different name:

```javascript
publicRepo: path.join(__dirname, '..', 'YOUR-PUBLIC-REPO-NAME'),
```

### Step 4: Run the Sync Script

```bash
cd "c:\Users\ASUS\Documents\My Programming\Projects\LT automation"
node sync-to-public.js
```

This will:
1. ✅ Build the production version
2. ✅ Copy files to public repo
3. ✅ Create a README for users
4. ✅ Commit changes

### Step 5: Push to GitHub

```bash
cd "c:\Users\ASUS\Documents\My Programming\Projects\lingotribe-extension-public"
git push origin main
```

Or use the auto-push flag:
```bash
node sync-to-public.js --push
```

## 🔄 Workflow

### When You Make Changes:

1. **Edit source files** in your private repo
2. **Test** your changes
3. **Run sync script**:
   ```bash
   node sync-to-public.js --push
   ```
4. **Done!** Public repo is updated automatically

## 🔒 Private Repository Setup

### Option A: Keep Current Repo Private

1. Go to your GitHub repository settings
2. Navigate to "Danger Zone"
3. Click "Change repository visibility"
4. Select "Private"

### Option B: Create New Private Repo

1. Create a new **private** repository on GitHub
2. Push your current code:
   ```bash
   git remote add origin https://github.com/yourusername/lingotribe-private.git
   git branch -M main
   git push -u origin main
   ```

## 📊 Final Setup

After setup, you'll have:

### Private Repository 🔒
- **URL**: `https://github.com/yourusername/lingotribe-private`
- **Visibility**: Private
- **Contains**: Source code, build scripts, development files
- **Access**: Only you and collaborators

### Public Repository 🌍
- **URL**: `https://github.com/yourusername/lingotribe-transcription-enhancer`
- **Visibility**: Public
- **Contains**: Production build (obfuscated), README, LICENSE
- **Access**: Everyone can download and use

## 🎉 Benefits

✅ **Source code stays private** - Your original code is protected  
✅ **Easy distribution** - Users can download and install directly  
✅ **No build required** - Users don't need Node.js or build tools  
✅ **Automatic sync** - One command updates public repo  
✅ **Professional** - Clean separation of concerns  

## 🚀 Quick Reference

```bash
# Build and sync to public repo
node sync-to-public.js

# Build, sync, and auto-push
node sync-to-public.js --push

# Just build (no sync)
node build-production.js
```

## ⚠️ Important Notes

1. **Never commit sensitive data** to the public repo
2. **Firebase config** is obfuscated but still contains credentials
3. **Test the public build** before pushing
4. **Keep .gitignore** updated in both repos
5. **Sync regularly** to keep public repo up to date

## 📞 Need Help?

If you encounter issues:
1. Check that both repositories exist
2. Verify git is configured correctly
3. Ensure you have push access to both repos
4. Check the sync script output for errors
