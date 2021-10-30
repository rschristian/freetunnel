import polka from 'polka';
import { raw } from '@polka/parse';
import WebSocket from 'ws';
import { uid } from 'uid';
import http from 'http';

const {
    /** @type {(number | string)} */ FREETUNNEL_PORT = 3000,
    /** @type {(number | string)} */ FREETUNNEL_PASSWORD = uid(),
    /** @type {(number | string)} */ MAX_FREE_SUBDOMAINS = 5,
} = process.env;

console.log('====================================================');
console.log(`Your Freetunnel server's password is "${FREETUNNEL_PASSWORD}"`);
console.log('====================================================');

const server = http.createServer();
const socketMap = {};
let currentFreeSubdomainCount = 0;

polka({ server })
    .use(raw({ type: '/' }))
    .all('/*', (req, res) => {
        const subdomain = getSubdomain(req);
        const generated = uid();
        if (socketMap[subdomain]) {
            const responder = ({ data }) => {
                const socketMessage = JSON.parse(data);
                const resource = socketMessage.body;

                if (socketMessage.event === generated) {
                    res.writeHead(resource.status, resource.headers);
                    if (resource.body) {
                        res.write(Buffer.from(resource.body), 'binary');
                    }
                    res.end();
                    socketMap[subdomain].clientSocket.removeEventListener('message', responder);
                }
            };
            socketMap[subdomain].clientSocket.addEventListener('message', responder);
            sendMessage(socketMap[subdomain].clientSocket, {
                event: 'resource',
                body: {
                    url: req._parsedUrl._raw,
                    headers: req.headers,
                    body: req.body,
                    method: req.method,
                    uuid: generated,
                    protocol: 'https',
                },
            });
        } else {
            res.end('Unknown Error');
        }
    })
    .listen(FREETUNNEL_PORT, (err) => {
        if (err) throw err;
        console.log(`> Running on localhost:${FREETUNNEL_PORT}`);
    });

new WebSocket.Server({ server }).on('connection', (socket, req) => {
    if (req.headers.origin) {
        const subdomain = getSubdomain(req);
        if (socketMap[subdomain]) {
            if (!socketMap[subdomain].browserSocket) socketMap[subdomain].browserSocket = [];
            socketMap[subdomain].browserSocket.push(socket);
            sendMessage(socketMap[subdomain].clientSocket, {
                event: 'hmr',
                body: {
                    url: req.url,
                    headers: req.headers,
                },
            });
        }
    }
    socket.on('message', (message) => {
        const socketMessage = JSON.parse(message);

        switch (socketMessage.event) {
            case 'auth': {
                const { password, subdomain } = socketMessage.body;

                let freeSubdomain = false;
                if (password && FREETUNNEL_PASSWORD !== password) {
                    sendMessage(socket, {
                        event: 'authFailure',
                        message: 'provided password being incorrect',
                    });
                    return;
                } else if (!password) {
                    if (currentFreeSubdomainCount === parseInt(MAX_FREE_SUBDOMAINS, 10)) {
                        sendMessage(socket, {
                            event: 'authFailure',
                            message: 'all unauthorized subdomains being already in use',
                        });
                        return;
                    }
                    currentFreeSubdomainCount++;
                    freeSubdomain = true;
                }
                if (socketMap[subdomain]) {
                    sendMessage(socket, {
                        event: 'authFailure',
                        message: 'subdomain being already in use',
                    });
                    return;
                }
                sendMessage(socket, { event: 'authSuccess' });
                socketMap[subdomain] = {
                    clientSocket: socket,
                    freeSubdomain,
                };
                break;
            }
            case 'hmrUpdate': {
                for (const socket of socketMap[socketMessage.body.subdomain].browserSocket) {
                    socket.send(socketMessage.body.message);
                }
                break;
            }
        }
    });

    socket.on('close', () => {
        for (const [key, value] of Object.entries(socketMap)) {
            if (req.headers.origin) {
                const index = value.browserSocket?.indexOf(socket);
                if (index > -1) value.browserSocket.splice(index, 1);
                break;
            } else if (value.clientSocket === socket) {
                if (value.freeSubdomain) currentFreeSubdomainCount--;
                delete socketMap[key];
                break;
            }
        }
    });
});

/**
 * @param {Request} req
 * @returns {string}
 */
function getSubdomain(req) {
    return req.headers['x-forwarded-host'].split('.')[0];
}

function sendMessage(socket, message) {
    socket.send(JSON.stringify(message));
}
