// login.js
// Login page logic (Edge and Chrome compatible)

// Google OAuth configuration
const GOOGLE_CLIENT_ID = '1010141748894-5rbncenvbcc3ddp212oacsag2fdvfu4n.apps.googleusercontent.com';
const REDIRECT_URI = `https://${chrome.runtime.id}.chromiumapp.org/`;
const SCOPES = 'email profile';

// Debug logging
console.log('=== OAuth Configuration ===');
console.log('Extension ID:', chrome.runtime.id);
console.log('Redirect URI:', REDIRECT_URI);
console.log('Client ID:', GOOGLE_CLIENT_ID);
console.log('==========================');

document.addEventListener('DOMContentLoaded', async () => {
    const signInBtn = document.getElementById('signInBtn');
    const signOutBtn = document.getElementById('signOutBtn');
    const loading = document.getElementById('loading');
    const statusMessage = document.getElementById('statusMessage');
    const loginSection = document.getElementById('loginSection');
    const userInfo = document.getElementById('userInfo');

    // Initialize auth manager
    await authManager.init();

    // Check if already authenticated
    const isAuth = await authManager.isUserAuthenticated();
    if (isAuth) {
        showUserInfo();
    }

    // Sign in button click
    signInBtn.addEventListener('click', async () => {
        showLoading(true);
        hideStatus();

        try {
            // Use web-based OAuth flow
            const userInfoData = await signInWithGoogleWebFlow();

            if (userInfoData) {
                // Complete sign-in with auth manager
                const result = await authManager.completeSignIn(userInfoData);

                showLoading(false);

                if (result.success) {
                    showStatus('success', `Welcome! Signed in as ${result.email}`);
                    setTimeout(() => {
                        showUserInfo();
                    }, 1000);
                } else {
                    showStatus('error', result.error || 'Sign-in failed. Please try again.');
                }
            } else {
                showLoading(false);
                showStatus('error', 'Sign-in was cancelled or failed.');
            }
        } catch (error) {
            showLoading(false);
            showStatus('error', error.message || 'Sign-in failed. Please try again.');
        }
    });

    // Sign out button click
    signOutBtn.addEventListener('click', async () => {
        await authManager.signOut();
        showStatus('info', 'Signed out successfully');
        hideUserInfo();
    });

    // Listen for auth revoked message
    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'AUTH_REVOKED') {
            showStatus('error', message.message);
            hideUserInfo();
        }
    });

    // Web-based OAuth flow using chrome.identity.launchWebAuthFlow
    async function signInWithGoogleWebFlow() {
        return new Promise((resolve, reject) => {
            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
                `client_id=${GOOGLE_CLIENT_ID}&` +
                `response_type=token&` +
                `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
                `scope=${encodeURIComponent(SCOPES)}`;

            console.log('[Login] Starting OAuth flow...');
            console.log('[Login] Auth URL:', authUrl);

            // Use chrome.identity.launchWebAuthFlow
            if (chrome.identity && chrome.identity.launchWebAuthFlow) {
                console.log('[Login] Using chrome.identity.launchWebAuthFlow');

                chrome.identity.launchWebAuthFlow(
                    {
                        url: authUrl,
                        interactive: true
                    },
                    async (responseUrl) => {
                        if (chrome.runtime.lastError) {
                            console.error('[Login] OAuth error:', chrome.runtime.lastError);
                            reject(new Error(chrome.runtime.lastError.message));
                            return;
                        }

                        if (!responseUrl) {
                            reject(new Error('No response URL received'));
                            return;
                        }

                        console.log('[Login] Got response URL');

                        try {
                            // Extract access token from URL hash
                            const url = new URL(responseUrl);
                            const hash = url.hash.substring(1);
                            const params = new URLSearchParams(hash);
                            const accessToken = params.get('access_token');

                            if (accessToken) {
                                console.log('[Login] Got access token');
                                const userInfo = await authManager.getUserInfo(accessToken);
                                resolve(userInfo);
                            } else {
                                reject(new Error('No access token in response'));
                            }
                        } catch (error) {
                            console.error('[Login] Error parsing response:', error);
                            reject(error);
                        }
                    }
                );
            } else {
                reject(new Error('chrome.identity.launchWebAuthFlow not available'));
            }
        });
    }

    // Helper functions
    function showLoading(show) {
        if (show) {
            loading.classList.add('active');
            signInBtn.disabled = true;
        } else {
            loading.classList.remove('active');
            signInBtn.disabled = false;
        }
    }

    function showStatus(type, message) {
        statusMessage.className = `status-message ${type}`;
        statusMessage.textContent = message;
    }

    function hideStatus() {
        statusMessage.className = 'status-message';
        statusMessage.textContent = '';
    }

    async function showUserInfo() {
        const authData = await authManager.getStoredAuth();
        if (authData) {
            document.getElementById('userName').textContent = authData.name || 'User';
            document.getElementById('userEmail').textContent = authData.email;
            if (authData.picture) {
                document.getElementById('userAvatar').src = authData.picture;
            }

            loginSection.style.display = 'none';
            userInfo.classList.add('active');
        }
    }

    function hideUserInfo() {
        loginSection.style.display = 'block';
        userInfo.classList.remove('active');
    }
});
