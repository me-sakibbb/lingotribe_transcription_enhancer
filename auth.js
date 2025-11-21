// auth.js
// Authentication and Authorization Module (Web OAuth + Firebase)

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

            // Fetch authorized emails from Firebase
            const authorizedEmails = await this.getAuthorizedEmails();
            const isAuthorized = authorizedEmails.includes(email.toLowerCase());

            console.log('[Auth] User authorized:', isAuthorized);
            return isAuthorized;
        } catch (error) {
            console.error('[Auth] Verification error:', error);
            return false;
        }
    }

    /**
     * Get list of authorized emails
     * Fetches from Firebase Firestore
     */
    async getAuthorizedEmails() {
        try {
            // Fetch from Firebase
            if (typeof firebaseHelper !== 'undefined') {
                console.log('[Auth] Fetching authorized emails from Firebase...');
                const emails = await firebaseHelper.getAuthorizedEmails();

                if (emails && emails.length > 0) {
                    console.log('[Auth] Loaded', emails.length, 'authorized emails from Firebase');
                    return emails.map(email => email.toLowerCase());
                }
            }

            // Fallback to hardcoded list if Firebase fails
            console.warn('[Auth] Firebase unavailable, using fallback list');
            return [
                'sakibulhasan159@gmail.com'
                // Fallback list - only used if Firebase is unavailable
            ];
        } catch (error) {
            console.error('[Auth] Error fetching authorized emails:', error);
            // Fallback to hardcoded list on error
            return [
                'sakibulhasan159@gmail.com'
            ];
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
