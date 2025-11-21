// firebase-config.js
// Firebase configuration and initialization

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCzt_zZJMAUZ0QbhcBuy4fIG3JkVlzCSy4",
    authDomain: "anilab-42c99.firebaseapp.com",
    projectId: "anilab-42c99",
    storageBucket: "anilab-42c99.appspot.com",
    messagingSenderId: "897409077716",
    appId: "1:897409077716:web:e94b6ac83c03274c6fc641",
    measurementId: "G-K614ELZZKK"
};

// Firebase REST API helper class
class FirebaseHelper {
    constructor(config) {
        this.config = config;
        this.baseUrl = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents`;
    }

    /**
     * Fetch a document from Firestore
     * @param {string} path - Document path (e.g., 'lingotribe_transcription_enhancer/approved_emails')
     */
    async getDocument(path) {
        try {
            const url = `${this.baseUrl}/${path}`;
            console.log('[Firebase] Fetching document:', url);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Firebase fetch failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return this.parseDocument(data);
        } catch (error) {
            console.error('[Firebase] Error fetching document:', error);
            throw error;
        }
    }

    /**
     * Parse Firestore document format to plain JavaScript object
     */
    parseDocument(doc) {
        if (!doc.fields) {
            return null;
        }

        const result = {};
        for (const [key, value] of Object.entries(doc.fields)) {
            result[key] = this.parseValue(value);
        }
        return result;
    }

    /**
     * Parse Firestore value types
     */
    parseValue(value) {
        if (value.stringValue !== undefined) {
            return value.stringValue;
        }
        if (value.integerValue !== undefined) {
            return parseInt(value.integerValue);
        }
        if (value.doubleValue !== undefined) {
            return value.doubleValue;
        }
        if (value.booleanValue !== undefined) {
            return value.booleanValue;
        }
        if (value.arrayValue && value.arrayValue.values) {
            return value.arrayValue.values.map(v => this.parseValue(v));
        }
        if (value.mapValue && value.mapValue.fields) {
            const obj = {};
            for (const [k, v] of Object.entries(value.mapValue.fields)) {
                obj[k] = this.parseValue(v);
            }
            return obj;
        }
        if (value.nullValue !== undefined) {
            return null;
        }
        return null;
    }

    /**
     * Get authorized emails from Firestore
     */
    async getAuthorizedEmails() {
        try {
            console.log('[Firebase] Fetching authorized emails...');

            const doc = await this.getDocument('lingotribe_transcription_enhancer/approved_emails');

            if (doc && doc.emails && Array.isArray(doc.emails)) {
                console.log('[Firebase] Found', doc.emails.length, 'authorized emails');
                return doc.emails;
            }

            console.warn('[Firebase] No emails array found in document');
            return [];
        } catch (error) {
            console.error('[Firebase] Error getting authorized emails:', error);
            // Return empty array on error (fail closed - no access by default)
            return [];
        }
    }
}

// Export singleton instance
const firebaseHelper = new FirebaseHelper(firebaseConfig);

// Make available globally
if (typeof window !== 'undefined') {
    window.firebaseHelper = firebaseHelper;
}
