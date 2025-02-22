import type { WebSocket } from 'ws';
import type { Response } from 'polka';

export interface SocketMap {
    [subdomain: string]: {
        clientSocket: WebSocket;
        browserSockets?: WebSocket[];
    };
}

export interface ResponseMap {
    [requestId: string]: Response;
}
