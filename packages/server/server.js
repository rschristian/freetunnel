import polka from 'polka';
import { raw } from '@polka/parse';
import socketIo from 'socket.io';
import uuid from 'uuid/v4.js';
import http from 'http';

const { PORT = 3000 } = process.env;
const server = http.createServer();
const socketMap = {};

polka()
    .use(raw())
    .all('/*', (req, res) => {
        if (req.subdomains.length === 0) {
            req.end('Subdomain length invalid');
            return;
        }
        const subdomain = req.subdomains[req.subdomains.length - 1];
        const generated = uuid();
        if (socketMap[subdomain]) {
            socketMap[subdomain].on(generated, (object) => {
                res.set(object.headers);
                res.status(object.status);
                if (object.body) {
                    res.write(object.body, 'binary');
                }
                res.end();
                socketMap[subdomain].removeAllListeners(generated);
            });
            socketMap[subdomain].emit('page', {
                url: req._parsedUrl._raw,
                headers: req.headers,
                body: req.body,
                method: req.method,
                uuid: generated,
                protocol: req.protocol,
            });
        } else {
            res.end('Unknown Error');
        }
    })
    .listen(PORT, (err) => {
        if (err) throw err;
        console.log(`> Running on localhost:${PORT}`);
    });

socketIo(server).on('connection', (socket) => {
    socket.on('auth', ({ subdomain }) => {
        if (socketMap[subdomain]) {
            socket.emit('authFail');
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
