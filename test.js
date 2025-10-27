const WebSocket = require('ws');

function connectToDerivAPI() {
    return new Promise((resolve, reject) => {
        const socket = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=61696');

        socket.on('open', () => {
            console.log('[open] Connection established');
            console.log('Sending to server');
            socket.send(JSON.stringify({ ping: 1 }));
            resolve(socket);
        });

        socket.on('message', (msg) => {
            let data;
            try {
                data = JSON.parse(msg.toString());
            } catch (err) {
                console.warn('Received non-JSON message:', msg.toString());
                return;
            }

            if (data.tick) {
                if (typeof handleTickData === 'function') handleTickData(data.tick);
            } else if (data.history) {
                if (typeof handleHistoricalData === 'function') handleHistoricalData(data.history);
            } else if (data.active_symbols) {
                console.log('Active symbols:', data.active_symbols);

                // extract and print all display_name values as an array
                const displayNames = extractDisplayNames(data.active_symbols);
                console.log('Display names array:', displayNames);
            } else {
                // optional: uncomment to debug other responses
                // console.log('Message:', data);
            }
        });

        socket.on('error', (error) => {
            console.error('WebSocket error:', error);
            reject(error);
        });
    });
}

function extractDisplayNames(activeSymbols) {
    if (!Array.isArray(activeSymbols)) return [];
    return activeSymbols
        .map(s => s.display_name)
        .filter(name => typeof name === 'string');
}

function fetchActiveSymbols(ws) {
    const payload = {
        active_symbols: "brief",
        product_type: "basic",
        req_id: "active_symbols_1"
    };
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.error('WebSocket is not open.');
        return;
    }
    ws.send(JSON.stringify(payload));
    console.log('Requested active symbols');
}

connectToDerivAPI()
    .then((ws) => fetchActiveSymbols(ws))
    .catch(err => console.error(err));