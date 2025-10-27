// Minimal login/signup handler that integrates with Deriv's OAuth + WebSocket authorize flow.
// NOTE: you must provide a redirect page (REDIRECT_URI) that receives the OAuth token
// and posts it back to window.opener via postMessage({ type: 'deriv_auth', token }, origin).
// Example redirect page behaviour (host on your site):
//   const token = /* extract from URL hash or query */;
//   window.opener.postMessage({ type: 'deriv_auth', token }, window.location.origin);
//   window.close();
//
// Configure these values before use:
const APP_ID = 61696; // your app_id
const REDIRECT_URI = 'https://your.domain/deriv-oauth-redirect.html'; // must match redirect page you host
const OAUTH_ORIGIN = 'https://oauth.deriv.com'; // origin you expect messages from (redirect page origin)
const WS_ENDPOINT = `wss://ws.binaryws.com/websockets/v3?app_id=${APP_ID}`;

(() => {
  let popup = null;
  let loggedInUser = null;
  let ws = null;

  function findAccountButton() {
    // tries to find the "Account" button in the DOM (works with default markup)
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => b.textContent && b.textContent.trim().toLowerCase().includes('account')) || null;
  }

  function createAccountSummaryElement(user) {
    const container = document.createElement('div');
    container.className = 'account-summary flex items-center space-x-3';
    container.innerHTML = `
      <div class="account-type text-sm px-2 py-1 rounded text-white ${user.is_virtual ? 'bg-gray-500' : 'bg-green-600'}">
        ${user.is_virtual ? 'Demo' : 'Live'}
      </div>
      <div class="account-info text-sm">
        <div class="account-login">${escapeHtml(user.loginid || '—')}</div>
        <div class="account-balance text-xs text-gray-600">${escapeHtml(formatBalance(user.balance, user.currency))}</div>
      </div>
      <button class="logout-btn ml-3 text-xs px-2 py-1 border rounded">Logout</button>
    `;
    // logout handler
    container.querySelector('.logout-btn').addEventListener('click', () => {
      teardown();
      renderAccountButton(); // restore original button UI
    });
    return container;
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"'`=\/]/g, function (c) {
      return {
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
        "'": '&#39;', '/': '&#x2F;', '`': '&#x60;', '=': '&#x3D;'
      }[c];
    });
  }

  function formatBalance(balance, currency) {
    if (balance == null) return 'Balance: —';
    const num = Number(balance);
    if (Number.isNaN(num)) return `Balance: ${balance} ${currency || ''}`;
    return `${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency || ''}`;
  }

  function renderAccountButton() {
    const btn = findAccountButton();
    if (!btn) return;
    btn.style.minWidth = '140px';
    btn.textContent = 'Account';
    btn.addEventListener('click', onAccountClicked);
  }

  function onAccountClicked(e) {
    e.preventDefault();
    if (loggedInUser) {
      // already logged in: toggle details display
      const btn = findAccountButton();
      const parent = btn.parentElement;
      if (!parent) return;
      const existing = parent.querySelector('.account-summary');
      if (existing) {
        existing.remove();
      } else {
        parent.appendChild(createAccountSummaryElement(loggedInUser));
      }
      return;
    }
    // not logged in -> open Deriv OAuth popup
    openDerivLoginPopup();
  }

  function openDerivLoginPopup() {
    if (popup && !popup.closed) {
      popup.focus();
      return;
    }
    const authUrl = buildDerivAuthUrl();
    const width = 900;
    const height = 700;
    const left = Math.floor((screen.width - width) / 2);
    const top = Math.floor((screen.height - height) / 2);
    popup = window.open(authUrl, 'DerivLogin', `width=${width},height=${height},top=${top},left=${left}`);
    // fallback if popup blocked
    if (!popup) alert('Popup blocked. Please allow popups for this site.');
  }

  function buildDerivAuthUrl() {
    // Using implicit flow (response_type=token). Ensure redirect_uri is registered/hosted by you.
    const params = new URLSearchParams({
      app_id: String(APP_ID),
      l: 'EN',
      redirect_uri: REDIRECT_URI,
      response_type: 'token', // implicit flow: redirect with access token in hash
      authorize: 1
    });
    // oauth.deriv.com is the hosted oauth provider
    return `https://oauth.deriv.com/oauth2/authorize?${params.toString()}`;
  }

  // Listen for messages from the redirect page / popup
  window.addEventListener('message', async (event) => {
    try {
      // NOTE: for security validate origin in your deployment
      // Accept messages from your redirect page's origin
      // If you host redirect page on same origin, replace OAUTH_ORIGIN accordingly
      if (!event.data || event.data.type !== 'deriv_auth') return;
      // Optionally validate origin:
      // if (event.origin !== window.location.origin && event.origin !== OAUTH_ORIGIN) return;
      const token = event.data.token;
      if (!token) return console.warn('No token received');
      // close popup if open
      if (popup && !popup.closed) popup.close();
      // Use token to fetch account details
      const user = await fetchDerivAccount(token);
      if (user) {
        loggedInUser = user;
        applyAccountUI(user);
      } else {
        console.warn('Failed to fetch user from Deriv');
      }
    } catch (err) {
      console.error('Error handling auth message', err);
    }
  }, false);

  function applyAccountUI(user) {
    const btn = findAccountButton();
    if (!btn) return;
    // Replace button content with the account summary
    const parent = btn.parentElement;
    if (!parent) return;
    // Remove original button from DOM then re-insert account summary in its place
    btn.remove();
    parent.appendChild(createAccountSummaryElement(user));
  }

  async function fetchDerivAccount(token) {
    return new Promise((resolve, reject) => {
      try {
        const socket = new WebSocket(WS_ENDPOINT);
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

  function teardown() {
    loggedInUser = null;
    if (ws) try { ws.close(); } catch (e) { /* noop */ }
    ws = null;
    if (popup && !popup.closed) popup.close();
    popup = null;
  }

  // On load, attach listener to account button
  document.addEventListener('DOMContentLoaded', () => {
    renderAccountButton();
  });
})();