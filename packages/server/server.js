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
        const subdomain = req.headers['x-forwarded-host'].split('.')[0];
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
                    socketMap[subdomain]['socket'].removeEventListener('message', responder);
                }
            };
            socketMap[subdomain]['socket'].addEventListener('message', responder);
            sendMessage(socketMap[subdomain]['socket'], {
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

new WebSocket.Server({ server }).on('connection', (socket) => {
    socket.on('message', (message) => {
        const socketMessage = JSON.parse(message);

        if (socketMessage.event === 'auth') {
            const { password, subdomain } = socketMessage.body;

            let freeSubdomain = false;
            if (password && FREETUNNEL_PASSWORD !== password) {
                sendMessage(socket, { event: 'authFailure', message: 'provided password being incorrect' });
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
                sendMessage(socket, { event: 'authFailure', message: 'subdomain being already in use' });
                return;
            }
            sendMessage(socket, { event: 'authSuccess' });
            socketMap[subdomain] = {
                socket,
                freeSubdomain,
            };
        }
    });

    socket.on('close', () => {
        for (const [key, value] of Object.entries(socketMap)) {
            if (value['socket'] === socket) {
                if (value['freeSubdomain']) currentFreeSubdomainCount--;
                delete socketMap[key];
            }
        }
    });
});

function sendMessage(socket, message) {
    socket.send(JSON.stringify(message));
}
