#!/usr/bin/env node

/**
 * Sync Production Build to Public Repository
 * 
 * This script:
 * 1. Builds the production version
 * 2. Copies it to a separate public repository
 * 3. Commits and pushes to the public repo
 */

const fs = require('fs-extra');
const { execSync } = require('child_process');
const path = require('path');

// Configuration
const CONFIG = {
    // Path to your private repository (current location)
    privateRepo: __dirname,

    // Path to your public repository (you'll create this)
    // Change this to your actual public repo path
    publicRepo: path.join(__dirname, '..', 'lingotribe-extension-public'),

    // Production build folder name
    buildFolder: 'production-build'
};

console.log('🚀 Starting sync to public repository...\n');

// Step 1: Build production version
console.log('📦 Step 1: Building production version...');
try {
    execSync('node build-production.js', {
        cwd: CONFIG.privateRepo,
        stdio: 'inherit'
    });
    console.log('✅ Production build completed\n');
} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}

// Step 2: Check if public repo exists
console.log('📂 Step 2: Checking public repository...');
if (!fs.existsSync(CONFIG.publicRepo)) {
    console.log('⚠️  Public repository not found at:', CONFIG.publicRepo);
    console.log('\n📝 To set up the public repository:');
    console.log('   1. Create a new public repository on GitHub');
    console.log('   2. Clone it to:', CONFIG.publicRepo);
    console.log('   3. Run this script again\n');
    process.exit(1);
}
console.log('✅ Public repository found\n');

// Step 3: Clear public repo (except .git)
console.log('🧹 Step 3: Cleaning public repository...');
const publicRepoContents = fs.readdirSync(CONFIG.publicRepo);
publicRepoContents.forEach(item => {
    if (item !== '.git') {
        const itemPath = path.join(CONFIG.publicRepo, item);
        fs.removeSync(itemPath);
    }
});
console.log('✅ Public repository cleaned\n');

// Step 4: Copy production build
console.log('📋 Step 4: Copying production build...');
const sourcePath = path.join(CONFIG.privateRepo, CONFIG.buildFolder);
const files = fs.readdirSync(sourcePath);

files.forEach(file => {
    const src = path.join(sourcePath, file);
    const dest = path.join(CONFIG.publicRepo, file);
    fs.copySync(src, dest);
    console.log(`   ✓ Copied: ${file}`);
});
console.log('✅ Production build copied\n');

// Step 5: Create README for public repo
console.log('📝 Step 5: Creating public README...');
const publicReadme = `# Lingotribe Transcription Enhancer

Professional transcription enhancement extension with auto-correct, formatting, and smart text tools.

## 🚀 Installation

### For Chrome:
1. Download this repository (Click "Code" → "Download ZIP")
2. Extract the ZIP file
3. Open Chrome and go to \`chrome://extensions/\`
4. Enable "Developer mode" (toggle in top right)
5. Click "Load unpacked"
6. Select the extracted folder

### For Edge:
1. Download this repository (Click "Code" → "Download ZIP")
2. Extract the ZIP file
3. Open Edge and go to \`edge://extensions/\`
4. Enable "Developer mode" (toggle in left sidebar)
5. Click "Load unpacked"
6. Select the extracted folder

## ✨ Features

- **Auto-correct & Replacements**: Automatically replace common words and phrases
- **Smart Formatting**: Fix capitalization, punctuation, and spacing
- **Word Picker**: Quick access to frequently used phrases
- **Number Conversion**: Convert word numbers to digits
- **Bracket Formatting**: Clean up bracketed content like [uh], [mm], etc.
- **Phrase Removal**: Remove filler words and sounds
- **Google Authentication**: Secure access control

## 🔒 Security

This extension uses:
- Firebase Authentication with Google OAuth2
- Authorized email list for access control
- Obfuscated code for protection

## 📋 Version

**Version**: 2.1.0  
**Last Updated**: ${new Date().toISOString().split('T')[0]}

## 👥 Authors

Created by **me-sakibbb** & **NuhalMunawar**

## 📄 License

See LICENSE file for details.

## 🐛 Issues & Support

If you encounter any issues, please contact the authors.

---

**Note**: This is a production build with obfuscated code. Source code is maintained in a private repository.
`;

fs.writeFileSync(path.join(CONFIG.publicRepo, 'README.md'), publicReadme);
console.log('✅ README created\n');

// Step 6: Git operations
console.log('🔄 Step 6: Committing to public repository...');
try {
    // Check git status
    execSync('git add .', { cwd: CONFIG.publicRepo, stdio: 'inherit' });

    // Commit with timestamp
    const commitMessage = `Update production build - ${new Date().toISOString()}`;
    execSync(`git commit -m "${commitMessage}"`, {
        cwd: CONFIG.publicRepo,
        stdio: 'inherit'
    });

    console.log('✅ Changes committed\n');

    // Ask about pushing
    console.log('📤 Ready to push to GitHub!');
    console.log('   Run: cd "' + CONFIG.publicRepo + '" && git push');
    console.log('\n   Or run this script with --push flag to auto-push\n');

    if (process.argv.includes('--push')) {
        console.log('🚀 Pushing to GitHub...');
        execSync('git push', { cwd: CONFIG.publicRepo, stdio: 'inherit' });
        console.log('✅ Pushed to GitHub!\n');
    }

} catch (error) {
    if (error.message.includes('nothing to commit')) {
        console.log('ℹ️  No changes to commit\n');
    } else {
        console.error('❌ Git operation failed:', error.message);
        process.exit(1);
    }
}

console.log('✅ Sync completed successfully!\n');
console.log('📊 Summary:');
console.log('   Private Repo: ' + CONFIG.privateRepo);
console.log('   Public Repo:  ' + CONFIG.publicRepo);
console.log('   Build Folder: ' + CONFIG.buildFolder);
console.log('\n🎉 Your public repository is ready!\n');
