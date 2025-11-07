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
        // Listen for auth messages from popup
        window.addEventListener('message', this._handleAuthMessage.bind(this), false);
        
        // Check for stored token
        const storedToken = localStorage.getItem('deriv_token');
        if (storedToken) {
            console.log('DerivAuthService: Found stored token, validating...');
            await this.validateToken(storedToken);
        } else {
            console.log('DerivAuthService: No stored token found.');
        }
    }

    async login() {
        console.log('DerivAuthService: Attempting to open Deriv login popup.');
        const width = 900;
        const height = 700;
        const left = Math.floor((screen.width - width) / 2);
        const top = Math.floor((screen.height - height) / 2);

        const params = new URLSearchParams({
            app_id: AUTH_CONFIG.APP_ID,
            l: 'EN',
            redirect_uri: AUTH_CONFIG.REDIRECT_URI,
            response_type: 'token'
        });

        const popup = window.open(
            `${AUTH_CONFIG.OAUTH_URL}?${params.toString()}`,
            'DerivLogin',
            `width=${width},height=${height},top=${top},left=${left}`
        );

        if (!popup) {
            throw new Error('Popup blocked. Please allow popups for this site.');
        }
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
