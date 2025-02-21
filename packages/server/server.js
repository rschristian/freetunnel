import { createServer } from 'node:http';

import polka from 'polka';
import { raw } from '@polka/parse';
import { WebSocketServer } from 'ws';
import { uid } from 'uid';

const FREETUNNEL_PORT = parseIntEnvVar('FREETUNNEL_PORT', 3000);

const FREETUNNEL_MAX_SUBDOMAINS = parseIntEnvVar('FREETUNNEL_MAX_SUBDOMAINS', 3);

const server = createServer();
/** @type {import('./index.d.ts').SocketMap} */
const socketMap = {};
const responseMap = {};

polka({ server })
    .use(raw({ type: '/' }))
    .get('/', (req, res, next) => {
        if (req.headers.host.split('.').length < 3) {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('I might put a docs page here one day, but for now, please go to https://github.com/rschristian/freetunnel');
            return;
        }
        next();
    })
    .get('/health-check', (_req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('All Healthy!');
    })
    .all('/*', (req, res) => {
        const subdomain = getSubdomain(req.headers);

        if (socketMap[subdomain]) {
            const requestId = uid();
            responseMap[requestId] = res;

            sendMessage(socketMap[subdomain].clientSocket, {
                event: 'resource',
                body: {
                    url: req._parsedUrl.raw,
                    headers: req.headers,
                    body: req.body,
                    method: req.method,
                    uuid: requestId,
                },
            });
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Subdomain has not been registered');
        }
    })
    .listen(FREETUNNEL_PORT, (err) => {
        if (err) throw err;
        console.log(`> Running on localhost:${FREETUNNEL_PORT}`);
    });

new WebSocketServer({ server }).on('connection', (socket, req) => {
    // Differentiates freetunnel client from (say) a browser ws connection
    if (req.headers.origin) {
        const subdomain = getSubdomain(req.headers);
        if (socketMap[subdomain]) {
            if (!socketMap[subdomain].browserSockets) socketMap[subdomain].browserSockets = [];
            socketMap[subdomain].browserSockets.push(socket);
            sendMessage(socketMap[subdomain].clientSocket, {
                event: 'hmrInit',
                body: {
                    url: req.url,
                    headers: req.headers,
                },
            });
        }
    }

    socket.on('message', (message) => {
        const { event, body } = JSON.parse(message.toString());

        if (event === 'init') {
            if (Object.keys(socketMap).length === FREETUNNEL_MAX_SUBDOMAINS) {
                sendMessage(socket, {
                    event: 'initFailure',
                    message: 'all subdomains being already in use',
                });
            } else if (socketMap[body.subdomain]) {
                sendMessage(socket, {
                    event: 'initFailure',
                    message: 'subdomain being already in use',
                });
            }

            sendMessage(socket, { event: 'initSuccess' });
            socketMap[body.subdomain] = { clientSocket: socket };
        }

        if (event === 'hmrUpdate') {
            for (const socket of socketMap[body.subdomain].browserSockets) {
                socket.send(body.message);
            }
        }

        const res = responseMap[event];
        if (res) {
            res.writeHead(body.status, body.headers);
            // Needs better var naming
            if (body.body) res.write(Buffer.from(body.body), 'binary');
            res.end();
            delete responseMap[event];
        }
    });

    socket.on('close', () => {
        for (const [key, value] of Object.entries(socketMap)) {
            if (req.headers.origin) {
                const index = value.browserSockets?.indexOf(socket);
                if (index > -1) value.browserSockets.splice(index, 1);
                break;
            } else if (value.clientSocket === socket) {
                delete socketMap[key];
                break;
            }
        }
    });
});

/**
 * @param {string} envVar
 * @param {number} defaultValue
 * @returns {number}
 */
function parseIntEnvVar(envVar, defaultValue) {
    const parsed = parseInt(process.env[envVar], 10);

    return process.env[envVar] && !isNaN(parsed) ? parsed : defaultValue;
}

/**
 * @param {import('node:http').IncomingHttpHeaders} headers
 * @returns {string}
 */
function getSubdomain(headers) {
    return headers.host.split('.')[0];
}

function sendMessage(socket, message) {
    socket.send(JSON.stringify(message));
}
