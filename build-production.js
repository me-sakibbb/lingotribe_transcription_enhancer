const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

// Configuration for obfuscation
const obfuscationOptions = {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    debugProtection: false,  // Disabled to prevent auth issues
    debugProtectionInterval: 0,
    disableConsoleOutput: false,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: true,
    renameGlobals: false,
    selfDefending: false,  // Disabled to prevent auth issues
    simplify: true,
    splitStrings: true,
    splitStringsChunkLength: 10,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayEncoding: ['base64'],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 2,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersParametersMaxCount: 4,
    stringArrayWrappersType: 'function',
    stringArrayThreshold: 0.75,
    transformObjectKeys: true,
    unicodeEscapeSequence: false
};

// Lighter obfuscation for auth-related files (to prevent breaking functionality)
const lightObfuscationOptions = {
    compact: true,
    controlFlowFlattening: false,  // Disabled for auth
    deadCodeInjection: false,  // Disabled for auth
    debugProtection: false,
    disableConsoleOutput: false,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: false,  // Disabled for auth
    renameGlobals: false,
    selfDefending: false,
    simplify: true,
    splitStrings: false,  // Disabled for auth
    stringArray: true,
    stringArrayEncoding: ['base64'],
    stringArrayThreshold: 0.5,  // Lower threshold
    transformObjectKeys: false,  // Disabled for auth
    unicodeEscapeSequence: false
};

// Files that need lighter obfuscation (auth-related)
const lightObfuscationFiles = [
    'auth.js',
    'firebase-config.js',
    'login.js'
];

// Files to obfuscate
const jsFiles = [
    'auth.js',
    'background.js',
    'content.js',
    'firebase-config.js',
    'login.js',
    'options.js',
    'popup.js'
];

// Files to copy as-is
const htmlFiles = [
    'login.html',
    'oauth-callback.html',
    'options.html',
    'popup.html'
];

const otherFiles = [
    'manifest.json',
    'LICENSE'
];

const sourceDir = __dirname;
const targetDir = path.join(__dirname, 'production-build');

console.log('🚀 Starting production build...\n');

// Create production-build directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir);
}

// Obfuscate JavaScript files
console.log('🔒 Obfuscating JavaScript files...');
jsFiles.forEach(file => {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);

    if (fs.existsSync(sourcePath)) {
        const code = fs.readFileSync(sourcePath, 'utf8');

        // Use lighter obfuscation for auth-related files
        const options = lightObfuscationFiles.includes(file) ? lightObfuscationOptions : obfuscationOptions;
        const obfuscationType = lightObfuscationFiles.includes(file) ? 'light obfuscation' : 'full obfuscation';

        const obfuscatedCode = JavaScriptObfuscator.obfuscate(code, options).getObfuscatedCode();
        fs.writeFileSync(targetPath, obfuscatedCode);
        console.log(`  ✓ ${file} - ${obfuscationType}`);
    } else {
        console.log(`  ⚠ ${file} - not found, skipping`);
    }
});

// Copy HTML files
console.log('\n📄 Copying HTML files...');
htmlFiles.forEach(file => {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);

    if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`  ✓ ${file}`);
    } else {
        console.log(`  ⚠ ${file} - not found, skipping`);
    }
});

// Copy other files
console.log('\n📋 Copying other files...');
otherFiles.forEach(file => {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);

    if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`  ✓ ${file}`);
    } else {
        console.log(`  ⚠ ${file} - not found, skipping`);
    }
});

// Create README for production build
const productionReadme = `# Lingotribe Transcription Enhancer - Production Build

This is the production-ready, obfuscated version of the Lingotribe Transcription Enhancer extension.

## Installation

1. Open Chrome/Edge and navigate to \`chrome://extensions/\` or \`edge://extensions/\`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select this folder

## Security

All JavaScript files in this build have been obfuscated to protect the source code.
The obfuscation includes:
- Control flow flattening
- Dead code injection
- String array encoding
- Debug protection
- Self-defending code

## Version

Version: 2.1.0
Build Date: ${new Date().toISOString()}

## Authors

Created by me-sakibbb & NuhalMunawar

## License

See LICENSE file for details.
`;

fs.writeFileSync(path.join(targetDir, 'README.md'), productionReadme);
console.log('\n📝 Created production README.md');

console.log('\n✅ Production build completed successfully!');
console.log(`📦 Output directory: ${targetDir}`);
