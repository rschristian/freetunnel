import polka from 'polka';
import { raw } from '@polka/parse';
import { Server } from 'socket.io';
import { uid } from 'uid';
import http from 'http';

const { PORT = 3000 } = process.env;
const { FREETUNNEL_PASSWORD = uid() } = process.env;
const { MAX_FREE_SUBDOMAINS = 5 } = process.env;

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
            socketMap[subdomain].on(generated, (object) => {
                res.writeHead(object.status, object.headers);
                if (object.body) {
                    res.write(object.body, 'binary');
                }
                res.end();
                socketMap[subdomain].removeAllListeners(generated);
            });
            socketMap[subdomain].emit('resource', {
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
    .listen(PORT, (err) => {
        if (err) throw err;
        console.log(`> Running on localhost:${PORT}`);
    });

new Server(server).on('connection', (socket) => {
    socket.on('auth', ({ subdomain, password }) => {
        if (FREETUNNEL_PASSWORD !== password && currentFreeSubdomainCount === MAX_FREE_SUBDOMAINS) {
            socket.emit('authFail', 'All un-authorized subdomains are already in use');
            return;
        }
        if (socketMap[subdomain]) {
            socket.emit('authFail', 'Subdomain already in use');
            return;
        }
        socket.emit('authSuccess');
        socketMap[subdomain] = socket;
    });

    socket.on('disconnect', () => {
        Object.entries(socketMap).forEach((entry) => {
            if (entry[1] === socket) {
                delete socketMap[entry[0]];
            }
        });
    });

    //TODO: make it cleanup and not use existing names.
});
