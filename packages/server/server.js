import polka from 'polka';
import { raw } from '@polka/parse';
import { Server } from 'socket.io';
import { uid } from 'uid';
import http from 'http';

const { FREETUNNEL_PORT = 3000, FREETUNNEL_PASSWORD = uid(), MAX_FREE_SUBDOMAINS = 5 } = process.env;

console.log('====================================================');
console.log(`Your Freetunnel server's password is ${FREETUNNEL_PASSWORD}`);
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
            socketMap[subdomain]['socket'].on(generated, (object) => {
                res.writeHead(object.status, object.headers);
                if (object.body) {
                    res.write(object.body, 'binary');
                }
                res.end();
                socketMap[subdomain]['socket'].removeAllListeners(generated);
            });
            socketMap[subdomain]['socket'].emit('resource', {
                url: req._parsedUrl._raw,
                headers: req.headers,
                body: req.body,
                method: req.method,
                uuid: generated,
                protocol: 'https',
            });
        } else {
            res.end('Unknown Error');
        }
    })
    .listen(FREETUNNEL_PORT, (err) => {
        if (err) throw err;
        console.log(`> Running on localhost:${FREETUNNEL_PORT}`);
    });

new Server(server).on('connection', (socket) => {
    socket.on('auth', ({ subdomain, password }) => {
        let freeSubdomain = false;
        if (password && FREETUNNEL_PASSWORD !== password) {
            socket.emit('authFail', 'provided password being incorrect');
            return;
        } else if (!password) {
            if (currentFreeSubdomainCount === parseInt(MAX_FREE_SUBDOMAINS)) {
                socket.emit('authFail', 'all unauthorized subdomains being already in use');
                return;
            } else {
                currentFreeSubdomainCount++;
                freeSubdomain = true;
            }
        }
        if (socketMap[subdomain]) {
            socket.emit('authFail', 'subdomain being already in use');
            return;
        }
        socket.emit('authSuccess');
        socketMap[subdomain] = {
            socket,
            freeSubdomain,
        };
    });

    socket.on('disconnect', () => {
        for (const [key, value] of Object.entries(socketMap)) {
            if (value['socket'] === socket) {
                if (value['freeSubdomain']) currentFreeSubdomainCount--;
                delete socketMap[key];
            }
        }
    });

    //TODO: make it cleanup and not use existing names.
});
