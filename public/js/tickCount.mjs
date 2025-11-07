// tickCount.mjs
// Fetches and displays the latest 20 ticks (2 rows × 10 columns) beside Current Price
import { authService } from './authService.mjs';

const TICKS_LIMIT = 20;
const MARKET = 'R_100'; // Default market
const WS_URL = 'wss://ws.binaryws.com/websockets/v3';

class TickStream {
    constructor() {
        this.ws = null;
        this.ticks = [];
        this.container = null;
        this.priceElement = document.getElementById('currentPrice');
        this.market = MARKET;
        this.token = null;
    }

    async init() {
        await authService.init();
        this.token = authService.token || localStorage.getItem('deriv_token');

        if (!this.token) {
            console.warn('⚠️ No token found. Tick stream will run in guest mode.');
        }

        this._createTickContainer();
        this._connectWebSocket();
    }

    _createTickContainer() {
        const currentPriceCard = document.querySelector('.bg-white.rounded-xl.p-4.shadow-sm.border');
        if (!currentPriceCard) return;

        this.container = document.createElement('div');
        this.container.id = 'tickGrid';
        this.container.className = `
            grid grid-rows-2 grid-cols-10 gap-2 mt-4 
            text-center text-sm font-medium text-gray-700
        `;

        currentPriceCard.parentNode.insertBefore(this.container, currentPriceCard.nextSibling);
    }

    _connectWebSocket() {
        this.ws = new WebSocket(WS_URL);

        this.ws.onopen = () => {
            console.log(`✅ Connected to Deriv ticks stream for ${this.market}`);

            // Authorize first if token exists
            if (this.token) {
                this.ws.send(JSON.stringify({ authorize: this.token }));
            } else {
                this._fetchLastTicks(); // fallback to guest mode
            }
        };

        this.ws.onmessage = (msg) => {
            const data = JSON.parse(msg.data);

            if (data.error) {
                console.error('❌ WebSocket error:', data.error.message);
                return;
            }

            // After authorization, start fetching ticks
            if (data.msg_type === 'authorize') {
                console.log('🔐 Authorized as', data.authorize.loginid);
                this._fetchLastTicks();
            }

            // Handle history fetch
            if (data.msg_type === 'tick_history' && data.history) {
                const prices = data.history.prices.slice(-TICKS_LIMIT);
                this.ticks = prices.map(parseFloat);
                this._renderTicks();
            }

            // Handle live tick updates
            if (data.msg_type === 'tick' && data.tick) {
                this._addTick(parseFloat(data.tick.quote));
            }
        };

        this.ws.onerror = (err) => {
            console.error('❌ WebSocket error:', err);
        };

        this.ws.onclose = () => {
            console.warn('⚠️ Connection closed. Reconnecting in 3s...');
            setTimeout(() => this._connectWebSocket(), 3000);
        };
    }

    _fetchLastTicks() {
        this.ws.send(
            JSON.stringify({
                ticks_history: this.market,
                adjust_start_time: 1,
                count: TICKS_LIMIT,
                end: 'latest',
                start: 1,
                style: 'ticks',
                subscribe: 1,
            })
        );
    }

    _addTick(newTick) {
        this.ticks.unshift(newTick);
        if (this.ticks.length > TICKS_LIMIT) this.ticks.pop();
        this._renderTicks();
        this._updatePrice(newTick);
    }

    _updatePrice(price) {
        if (this.priceElement) {
            this.priceElement.textContent = `$${price.toFixed(2)}`;
        }
    }

    _renderTicks() {
        if (!this.container) return;

        this.container.innerHTML = '';
        this.ticks.forEach((tick) => {
            const tickEl = document.createElement('div');
            tickEl.className = `
                rounded-lg bg-gray-100 p-2 shadow-sm 
                hover:bg-blue-50 transition-colors
            `;
            tickEl.textContent = `$${tick.toFixed(2)}`;
            this.container.appendChild(tickEl);
        });
    }
}

// Initialize after page load
document.addEventListener('DOMContentLoaded', async () => {
    const tickStream = new TickStream();
    await tickStream.init();
});
