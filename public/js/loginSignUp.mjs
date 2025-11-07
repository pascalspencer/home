import { AUTH_CONFIG } from './authConfig.mjs';
import { authService } from './authService.mjs'; // Import authService

export class DerivAuthHandler {
    constructor() {
        this.loggedInUser = null;
        this.ws = null;
        this.loginBtn = null;
        this.userDisplay = null;
        this.authListeners = new Set();
    }

    init() {
        this.loginBtn = document.getElementById('accountBtn');
        this.userDisplay = document.getElementById('userDetails');

        authService.onAuthChange((user) => this._updateUI(user));
        authService.init();

        if (this.loginBtn) {
            this.loginBtn.addEventListener('click', () => {
                if (authService.user) {
                    authService.logout();
                } else {
                    authService.login();
                }
            });
        }
    }
    _updateUI(user) {
        if (user) {
            this.loginBtn.innerHTML = `<i class="fas fa-sign-out-alt mr-2"></i>Logout`;
            this.userDisplay.innerHTML = `
                <div class="text-sm text-gray-700">
                    <p><strong>ID:</strong> ${user.loginid}</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Balance:</strong> ${user.balance} ${user.currency}</p>
                    <p><strong>Type:</strong> ${user.is_virtual ? 'Demo' : 'Real'}</p>
                </div>`;
            this.userDisplay.classList.remove('hidden');
        } else {
            this.loginBtn.innerHTML = `<i class="fas fa-user mr-2"></i>Login`;
            this.userDisplay.innerHTML = '';
            this.userDisplay.classList.add('hidden');
        }
    }

    findAccountButton() {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(b => b.textContent && b.textContent.trim().toLowerCase().includes('account')) || null;
    }

    createAccountSummaryElement(user) {
        const container = document.createElement('div');
        container.className = 'account-summary flex items-center space-x-3';
        container.innerHTML = `
            <div class="account-type text-sm px-2 py-1 rounded text-white ${user.is_virtual ? 'bg-gray-500' : 'bg-green-600'}">
                ${user.is_virtual ? 'Demo' : 'Live'}
            </div>
            <div class="account-info text-sm">
                <div class="account-login">${this.escapeHtml(user.loginid || '—')}</div>
                <div class="account-balance text-xs text-gray-600">
                    ${this.escapeHtml(this.formatBalance(user.balance, user.currency))}
                </div>
            </div>
            <button class="logout-btn ml-3 text-xs px-2 py-1 border rounded">Logout</button>
        `;
        
        container.querySelector('.logout-btn').addEventListener('click', () => {
            this.logout();
        });
        return container;
    }

    escapeHtml(s) {
        if (s == null) return '';
        return String(s).replace(/[&<>"'`=\/]/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
            "'": '&#39;', '/': '&#x2F;', '`': '&#x60;', '=': '&#x3D;'
        })[c]);
    }

    formatBalance(balance, currency) {
        if (balance == null) return 'Balance: —';
        const num = Number(balance);
        if (Number.isNaN(num)) return `Balance: ${balance} ${currency || ''}`;
        return `${num.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })} ${currency || ''}`;
    }

    renderAccountButton() {
        const btn = this.findAccountButton();
        if (!btn) return;
        
        btn.style.minWidth = '140px';
        btn.textContent = 'Account';
        btn.addEventListener('click', this.onAccountClicked.bind(this));
    }

    onAccountClicked(e) {
        e.preventDefault();
        if (this.loggedInUser) {
            const btn = this.findAccountButton();
            const parent = btn?.parentElement;
            if (!parent) return;
            
            const existing = parent.querySelector('.account-summary');
            if (existing) {
                existing.remove();
            } else {
                parent.appendChild(this.createAccountSummaryElement(this.loggedInUser));
            }
        } else {
            // Since we are now using redirect, we should call the login method from authService
            // The authService will handle the redirection.
            // We need to import authService first.
            // For now, I'll leave this as a placeholder, as the task is to remove popup logic.
            authService.login();
        }
    }

    // Removed openDerivLoginPopup, buildDerivAuthUrl, handleAuthMessage as they are no longer needed for redirect flow.

    async validateToken(token) {
        const user = await this.fetchDerivAccount(token);
        if (user) {
            this.loggedInUser = user;
            localStorage.setItem('deriv_token', token);
            this.applyAccountUI(user);
            // Removed popup closing logic as we are no longer using popups.
        } else {
            throw new Error('Failed to fetch user details');
        }
    }

    async fetchDerivAccount(token) {
        return new Promise((resolve, reject) => {
            try {
                const socket = new WebSocket(AUTH_CONFIG.WS_ENDPOINT);
                let resolved = false;
                socket.onopen = () => {
                    // authorize with token
                    socket.send(JSON.stringify({ authorize: token, req_id: 'auth_1' }));
                };
                socket.onmessage = (e) => {
                    let data;
                    try { data = JSON.parse(e.data); } catch (err) { return; }
                    // handle authorization response
                    if (data.error) {
                        if (!resolved) { resolved = true; socket.close(); reject(data.error); }
                        return;
                    }
                    if (data.authorize) {
                        // authorize response may include loginid / is_virtual etc
                        const loginid = data.authorize.loginid || data.authorize.loginid?.toString();
                        const is_virtual = !!data.authorize.is_virtual;
                        // request balance
                        socket.send(JSON.stringify({ balance: 1, subscribe: 0, req_id: 'balance_1' }));
                        // wait for balance message, with a short timeout
                        const balanceTimeout = setTimeout(() => {
                          if (!resolved) {
                            resolved = true;
                            socket.close();
                            resolve({ loginid: loginid || '—', is_virtual, balance: null, currency: null });
                          }
                        }, 3000);
                        // attach handler for balance below continues
                        return;
                      }
                      if (data.balance) {
                        // Example structure: { balance: { balance: "123.45", currency: "USD" } }
                        const b = data.balance;
                        const balance = b?.balance ?? b ?? null;
                        const currency = b?.currency ?? null;
                        // We also may have seen authorize earlier; attempt to pull loginid from that.
                        // For robustness, request account details if missing
                        // Resolve with what we have
                        if (!resolved) {
                          resolved = true;
                          socket.close();
                          // Try to extract loginid/is_virtual from previous messages if available (best-effort)
                          const loginid = (data.echo_req && data.echo_req.loginid) || (data.authorize && data.authorize.loginid) || null;
                          const is_virtual = (data.authorize && !!data.authorize.is_virtual) || null;
                          resolve({ loginid: loginid || '—', is_virtual, balance, currency });
                        }
                        return;
                      }
                      // Some endpoints return get_account_status which can include is_virtual; handle generically
                      if (data.get_account_status) {
                        const status = data.get_account_status;
                        if (!resolved) {
                          resolved = true;
                          socket.close();
                          resolve({
                            loginid: status.loginid || '—',
                            is_virtual: !!status.is_virtual,
                            balance: null,
                            currency: null
                          });
                        }
                        return;
                      }
                    };
                    socket.onerror = (err) => {
                      if (!resolved) { resolved = true; socket.close(); reject(err); }
                    };
                    // safety timeout
                    setTimeout(() => {
                      if (!resolved) {
                        resolved = true;
                        try { socket.close(); } catch (e) { /* noop */ }
                        resolve(null);
                      }
                    }, 8000);
                  } catch (err) {
                    reject(err);
                  }
                });
    }

    applyAccountUI(user) {
        const btn = this.findAccountButton();
        if (!btn) return;
        
        const parent = btn.parentElement;
        if (!parent) return;
        
        btn.remove();
        parent.appendChild(this.createAccountSummaryElement(user));
    }

    logout() {
        localStorage.removeItem('deriv_token');
        this.loggedInUser = null;
        this.teardown();
        this.renderAccountButton();
    }

    teardown() {
        if (this.ws) {
            try { this.ws.close(); } catch (e) { /* noop */ }
        }
        this.ws = null;
        // Removed popup closing logic as we are no longer using popups.
        this.popup = null;
    }

    showError(message) {
        // You can implement your preferred error display method here
        console.error(message);
        alert(message);
    }
}

// Create auth config file
