import { AUTH_CONFIG } from './authConfig.mjs';

class DerivAuthService {
    constructor() {
        this.token = null;
        this.user = null;
        this.ws = null;
        this.authListeners = new Set();
    }

    async init() {
        console.log('DerivAuthService: Initializing...');

        let token = null;

        // Parse query params from URL
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));

        // Handle multiple possible token formats
        const tokenFromQuery = urlParams.get('token');
        const tokenFromHash = hashParams.get('token');

        // Handle multi-account Deriv redirects (token1/token2)
        const token1 = urlParams.get('token1');
        const token2 = urlParams.get('token2');

        // Store tokens if present
        if (token1) localStorage.setItem('real_token', token1);
        if (token2) localStorage.setItem('demo_token', token2);

        // Priority: token in query/hash > token1/token2 > stored token
        if (tokenFromQuery) token = tokenFromQuery;
        else if (tokenFromHash) token = tokenFromHash;
        else if (token1 || token2) {
            console.log('DerivAuthService: Found multiple tokens, validating both...');
            const validToken = await this._validateMultipleTokens([token1, token2]);
            token = validToken;
        }

        if (token) {
            console.log('DerivAuthService: Valid token found, validating...');
            await this.validateToken(token);
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } else {
            // Check localStorage as fallback
            const storedToken = localStorage.getItem('deriv_token');
            if (storedToken) {
                console.log('DerivAuthService: Found stored token, validating...');
                await this.validateToken(storedToken);
            } else {
                console.log('DerivAuthService: No stored token found.');
            }
        }
    }
    async _validateMultipleTokens(tokens) {
        for (const token of tokens) {
            if (!token) continue;
            try {
                const user = await this._fetchUserDetails(token);
                if (user) {
                    console.log(`DerivAuthService: Token for ${user.loginid} is valid.`);
                    localStorage.setItem('deriv_token', token);
                    this.token = token;
                    this.user = user;
                    this._notifyListeners();
                    return token;
                }
            } catch (e) {
                console.warn('DerivAuthService: Token invalid:', e);
            }
        }
        console.error('DerivAuthService: No valid tokens found.');
        return null;
    }



    async login() {
        console.log('DerivAuthService: Redirecting to Deriv login page.');
        const params = new URLSearchParams({
            app_id: AUTH_CONFIG.APP_ID,
            l: 'EN',
            redirect_uri: AUTH_CONFIG.REDIRECT_URI,
            response_type: 'token'
        });

        window.location.replace(`${AUTH_CONFIG.OAUTH_URL}?${params.toString()}`);
    }

    async logout() {
        console.log('DerivAuthService: Logging out...');
        localStorage.removeItem('deriv_token');
        this.token = null;
        this.user = null;
        this._notifyListeners();
    }

    onAuthChange(callback) {
        this.authListeners.add(callback);
        // Immediate callback with current state
        callback(this.user);
        return () => this.authListeners.delete(callback);
    }

    async _handleAuthMessage(event) {
        console.log('DerivAuthService: Received message from popup.', event);
        if (event.origin !== AUTH_CONFIG.APP_ORIGIN) {
            console.warn('DerivAuthService: Message origin mismatch.', event.origin);
            return;
        }
        if (!event.data || event.data.type !== 'deriv_auth') {
            console.warn('DerivAuthService: Invalid message data or type.', event.data);
            return;
        }

        const token = event.data.token;
        if (!token) {
            console.warn('DerivAuthService: No token found in message data.');
            return;
        }
        console.log('DerivAuthService: Token received, validating...');
        await this.validateToken(token);
    }

    async validateToken(token) {
        console.log('DerivAuthService: Validating token...');
        try {
            const user = await this._fetchUserDetails(token);
            if (user) {
                this.token = token;
                this.user = user;
                localStorage.setItem('deriv_token', token);
                this._notifyListeners();
            }
        } catch (err) {
            console.error('Token validation failed:', err);
            this.logout();
        }
    }

    async _fetchUserDetails(token) {
        console.log('DerivAuthService: Fetching user details...');
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(`${AUTH_CONFIG.WS_ENDPOINT}?app_id=${AUTH_CONFIG.APP_ID}`);
            
            const timeout = setTimeout(() => {
                console.error('DerivAuthService: Connection timeout during user details fetch.');
                ws.close();
                reject(new Error('Connection timeout'));
            }, 10000);

            ws.onopen = () => {
                console.log('DerivAuthService: WebSocket opened, sending authorize message.');
                ws.send(JSON.stringify({ authorize: token }));
            };

            ws.onmessage = (msg) => {
                const data = JSON.parse(msg.data);
                console.log('DerivAuthService: WebSocket message received:', data);
                
                if (data.error) {
                    console.error('DerivAuthService: Error during authorization:', data.error);
                    clearTimeout(timeout);
                    ws.close();
                    reject(data.error);
                    return;
                }

                if (data.authorize) {
                    console.log('DerivAuthService: Authorization successful, user details received.');
                    clearTimeout(timeout);
                    ws.close();
                    resolve({
                        loginid: data.authorize.loginid,
                        balance: data.authorize.balance,
                        currency: data.authorize.currency,
                        is_virtual: data.authorize.is_virtual,
                        email: data.authorize.email
                    });
                }
            };

            ws.onerror = (error) => {
                console.error('DerivAuthService: WebSocket error:', error);
                clearTimeout(timeout);
                reject(error);
            };
        });
    }

    _notifyListeners() {
        this.authListeners.forEach(callback => callback(this.user));
    }
}

export const authService = new DerivAuthService();
