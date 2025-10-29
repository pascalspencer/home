const WebSocket = require('ws');

class DerivWebSocket {
    constructor(appId = 108991) {
        this.ws = null;
        this.appId = appId;
        this.subscribers = new Map();
        this.pingInterval = null;
        this.reconnectDelay = 3000; // 3 seconds
        this.maxReconnectAttempts = 5;
        this.reconnectAttempts = 0;
        this.isManualClose = false;
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=${this.appId}`);

            this.ws.onopen = () => {
                console.log('[open] Connection established');
                this.startPing(); // start ping loop
                this.reconnectAttempts = 0;
                resolve(this.ws);
            };

            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.ping) {
                    console.log('[ping] pong received');
                } else {
                    this.notifySubscribers(data);
                }
            };

            this.ws.onerror = (error) => {
                console.error('[error]', error.message);
                reject(error);
            };

            this.ws.onclose = (event) => {
                this.stopPing();
                if (this.isManualClose) {
                    console.log('[close] Connection closed manually.');
                    return;
                }

                if (event.wasClean) {
                    console.log(`[close] Connection closed cleanly, code=${event.code}, reason=${event.reason}`);
                } else {
                    console.log('[close] Connection lost — attempting reconnect...');
                    this.handleReconnect();
                }
            };
        });
    }

    handleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('[reconnect] Max reconnect attempts reached. Stopping.');
            return;
        }

        setTimeout(async () => {
            this.reconnectAttempts++;
            console.log(`[reconnect] Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
            try {
                await this.connect();
                console.log('[reconnect] Reconnected successfully.');
            } catch (error) {
                console.error('[reconnect] Failed:', error.message);
                this.handleReconnect();
            }
        }, this.reconnectDelay);
    }

    startPing() {
        this.stopPing(); // clear any existing interval
        this.pingInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ ping: 1 }));
                console.log('[ping] sent');
            }
        }, 30000); // every 30 seconds
    }

    stopPing() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    subscribe(type, callback) {
        if (!this.subscribers.has(type)) {
            this.subscribers.set(type, new Set());
        }
        this.subscribers.get(type).add(callback);
    }

    unsubscribe(type, callback) {
        if (this.subscribers.has(type)) {
            this.subscribers.get(type).delete(callback);
        }
    }

    notifySubscribers(data) {
        if (data.tick) {
            this.subscribers.get('tick')?.forEach(cb => cb(data.tick));
        }
        if (data.history) {
            this.subscribers.get('history')?.forEach(cb => cb(data.history));
        }
        if (data.active_symbols) {
            this.subscribers.get('active_symbols')?.forEach(cb => cb(data.active_symbols));
        }
    }

    send(request) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(request));
        } else {
            console.error('WebSocket is not connected');
        }
    }

    close() {
        this.isManualClose = true;
        this.stopPing();
        if (this.ws) this.ws.close();
    }
}

module.exports = DerivWebSocket;
