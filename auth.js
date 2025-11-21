// auth.js
// Authentication and Authorization Module (Web OAuth only - works on Chrome and Edge)

class AuthManager {
    constructor() {
        this.isAuthenticated = false;
        this.userEmail = null;
        this.checkInterval = null;
    }

    /**
     * Initialize authentication
     */
    async init() {
        console.log('[Auth] Initializing authentication...');

        // Check if user is already authenticated
        const authData = await this.getStoredAuth();
        if (authData && authData.email) {
            this.userEmail = authData.email;
            this.isAuthenticated = await this.verifyUser(authData.email);
        }

        // Set up periodic verification (every 5 minutes)
        this.startPeriodicCheck();

        return this.isAuthenticated;
    }

    /**
     * Sign in with Google
     * Uses web-based OAuth flow (works on Edge and Chrome)
     */
    async signInWithGoogle() {
        try {
            console.log('[Auth] Starting Google sign-in with web flow...');

            // This will be handled by the login page
            // The login page will use Google's OAuth 2.0 web flow
            return {
                success: false,
                error: 'Please use the login page to sign in',
                requiresLoginPage: true
            };
        } catch (error) {
            console.error('[Auth] Sign-in error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Complete sign-in process after getting user info
     */
    async completeSignIn(userInfo) {
        // Verify user is authorized
        const isAuthorized = await this.verifyUser(userInfo.email);

        if (isAuthorized) {
            this.userEmail = userInfo.email;
            this.isAuthenticated = true;

            // Store auth data
            await this.storeAuth({
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture,
                timestamp: Date.now()
            });

            console.log('[Auth] User authenticated successfully');
            return { success: true, email: userInfo.email };
        } else {
            console.log('[Auth] User not authorized');
            await this.signOut();
            return { success: false, error: 'User not authorized. Please contact administrator.' };
        }
    }

    /**
     * Get user info from Google API
     */
    async getUserInfo(token) {
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to get user info');
        }

        return await response.json();
    }

    /**
     * Verify if user email is in authorized list
     */
    async verifyUser(email) {
        try {
            console.log('[Auth] Verifying user:', email);

            // OPTION 1: Check against hardcoded list (for testing)
            const authorizedEmails = await this.getAuthorizedEmails();
            const isAuthorized = authorizedEmails.includes(email.toLowerCase());

            // OPTION 2: Check against Firebase/backend (uncomment when ready)
            // const isAuthorized = await this.checkWithBackend(email);

            console.log('[Auth] User authorized:', isAuthorized);
            return isAuthorized;
        } catch (error) {
            console.error('[Auth] Verification error:', error);
            return false;
        }
    }

    /**
     * Get list of authorized emails
     * You can modify this to fetch from a backend/Firebase
     */
    async getAuthorizedEmails() {
        // OPTION 1: Hardcoded list (simple, but needs extension update to change)
        return [
            'your-email@gmail.com',
            'authorized-user@example.com',
            'sakibulhasan159@gmail.com'
            // Add more authorized emails here
        ];

        // OPTION 2: Fetch from your backend (recommended)
        // try {
        //   const response = await fetch('https://your-backend.com/api/authorized-users');
        //   const data = await response.json();
        //   return data.emails || [];
        // } catch (error) {
        //   console.error('[Auth] Failed to fetch authorized emails:', error);
        //   return [];
        // }

        // OPTION 3: Fetch from Firebase (best for real-time updates)
        // See implementation in AUTH_SETUP.md
    }

    /**
     * Check authorization with backend API
     */
    async checkWithBackend(email) {
        try {
            const response = await fetch('https://your-backend.com/api/check-authorization', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            return data.authorized === true;
        } catch (error) {
            console.error('[Auth] Backend check failed:', error);
            return false;
        }
    }

    /**
     * Sign out
     */
    async signOut() {
        console.log('[Auth] Signing out...');

        // Clear stored data
        await chrome.storage.local.remove(['authData']);

        this.isAuthenticated = false;
        this.userEmail = null;

        console.log('[Auth] Signed out successfully');
    }

    /**
     * Store authentication data
     */
    async storeAuth(data) {
        await chrome.storage.local.set({ authData: data });
    }

    /**
     * Get stored authentication data
     */
    async getStoredAuth() {
        const result = await chrome.storage.local.get(['authData']);
        return result.authData || null;
    }

    /**
     * Check if user is authenticated
     */
    async isUserAuthenticated() {
        if (!this.isAuthenticated) {
            const authData = await this.getStoredAuth();
            if (authData && authData.email) {
                this.isAuthenticated = await this.verifyUser(authData.email);
                this.userEmail = authData.email;
            }
        }
        return this.isAuthenticated;
    }

    /**
     * Get current user email
     */
    getUserEmail() {
        return this.userEmail;
    }

    /**
     * Start periodic authorization check
     */
    startPeriodicCheck() {
        // Check every 5 minutes
        this.checkInterval = setInterval(async () => {
            if (this.userEmail) {
                const isStillAuthorized = await this.verifyUser(this.userEmail);
                if (!isStillAuthorized) {
                    console.log('[Auth] User no longer authorized, signing out...');
                    await this.signOut();
                    // Notify user
                    chrome.runtime.sendMessage({
                        type: 'AUTH_REVOKED',
                        message: 'Your access has been revoked. Please contact administrator.'
                    });
                }
            }
        }, 5 * 60 * 1000); // 5 minutes
    }

    /**
     * Stop periodic check
     */
    stopPeriodicCheck() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }
}

// Export singleton instance
const authManager = new AuthManager();

// Make available globally
if (typeof window !== 'undefined') {
    window.authManager = authManager;
}

// For background script
if (typeof self !== 'undefined' && self.constructor.name === 'ServiceWorkerGlobalScope') {
    self.authManager = authManager;
}
