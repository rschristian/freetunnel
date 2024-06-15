import type { WebSocket } from 'ws';

interface SocketMap {
    [subdomain: string]: {
        clientSocket: WebSocket;
        browserSockets?: WebSocket[];
    };
}
