const endpoint = [
    'wss://ws.binaryws.com/websockets/v3',
    'wss://ws.derivws.com/websockets/v3'
];

function getWorkingEndpoint() {
    return new Promise(resolve => {
        let resolved = false;
        for (const url of endpoint) {
            const ws = new WebSocket(url);
            ws.onopen = () => {
                if (!resolved) {
                    resolved = true;
                    ws.close();
                    resolve(url);
                }
            };
            ws.onerror = () => {
                ws.close();
            };
        }
        // fallback if none connects
        setTimeout(() => {
            if (!resolved) resolve(endpoint[0]);
        }, 3000);
    });
}

const WS_ENDPOINT = await getWorkingEndpoint();



export const AUTH_CONFIG = {
    APP_ID: 108991,
    REDIRECT_URI: 'https://tradealgopro.vercel.app/',
    OAUTH_URL: 'https://oauth.deriv.com/oauth2/authorize',
    WS_ENDPOINT: {WS_ENDPOINT},
    APP_ORIGIN: 'https://tradealgopro.vercel.app'
};
