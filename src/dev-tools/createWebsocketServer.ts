import { WebSocketServer } from 'ws';
import { refreshPort } from './const';

/**
 * Taken from https://github.com/bholmesdev/simple-rsc/blob/main/server/dev.js
 * @returns {Set<WebSocket>}
 */
export function createWebSocketServer() {
    const wsServer = new WebSocketServer({
        port: refreshPort
    });
    
    const sockets: Set<WebSocket> = new Set();
    
    wsServer.on('connection', (ws) => {
        sockets.add(ws);
        // @ts-ignore
        ws.on('close', () => {
            sockets.delete(ws);
        });
    
        ws.send('connected');
    });

    return sockets
}
