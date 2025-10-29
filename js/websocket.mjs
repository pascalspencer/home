const WebSocket = require('ws');

class DerivWebSocket {
    constructor(appId = 108991) {
        this.ws = null;
        this.appId = appId;
        this.subscribers = new Map();
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=${this.appId}`);

            this.ws.onopen = () => {
                console.log('[open] Connection established');
                resolve(this.ws);
            };

            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.notifySubscribers(data);
            };

            this.ws.onerror = (error) => {
                console.error('[error]', error);
                reject(error);
            };

            this.ws.onclose = (event) => {
                if (event.wasClean) {
                    console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
                } else {
                    console.log('[close] Connection died');
                }
            };
        });
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
        // Notify relevant subscribers based on data type
        if (data.tick) {
            this.subscribers.get('tick')?.forEach(callback => callback(data.tick));
        }
        if (data.history) {
            this.subscribers.get('history')?.forEach(callback => callback(data.history));
        }
        if (data.active_symbols) {
            this.subscribers.get('active_symbols')?.forEach(callback => callback(data.active_symbols));
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
        if (this.ws) {
            this.ws.close();
        }
    }
}

module.exports = DerivWebSocket;

/*
Instructions to run this code:

1. Ensure Node.js is installed on your machine. You can download it from https://nodejs.org/.
2. Install the `ws` WebSocket library by running:
   npm install ws
3. Save this code to a file, e.g., `websocket_client.js`.
4. Open a terminal and navigate to the directory where you saved the file.
5. Run the code using the following command:
   node websocket_client.js

Ensure that the `app_id` in the URL is replaced with your own if needed.
*/
