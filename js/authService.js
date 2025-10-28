import { AUTH_CONFIG } from './authConfig.js';

class DerivAuthService {
    constructor() {
        this.token = null;
        this.user = null;
        this.ws = null;
        this.authListeners = new Set();
    }

    async init() {
        // Listen for auth messages from popup
        window.addEventListener('message', this._handleAuthMessage.bind(this), false);
        
        // Check for stored token
        const storedToken = localStorage.getItem('deriv_token');
        if (storedToken) {
            await this.validateToken(storedToken);
        }
    }

    async login() {
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
        if (event.origin !== AUTH_CONFIG.APP_ORIGIN) return;
        if (!event.data || event.data.type !== 'deriv_auth') return;

        const token = event.data.token;
        if (!token) return;

        await this.validateToken(token);
    }

    async validateToken(token) {
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
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(`${AUTH_CONFIG.WS_ENDPOINT}?app_id=${AUTH_CONFIG.APP_ID}`);
            
            const timeout = setTimeout(() => {
                ws.close();
                reject(new Error('Connection timeout'));
            }, 10000);

            ws.onopen = () => {
                ws.send(JSON.stringify({ authorize: token }));
            };

            ws.onmessage = (msg) => {
                const data = JSON.parse(msg.data);
                
                if (data.error) {
                    clearTimeout(timeout);
                    ws.close();
                    reject(data.error);
                    return;
                }

                if (data.authorize) {
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