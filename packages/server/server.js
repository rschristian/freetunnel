import polka from 'polka';
import { Server } from 'socket.io';
import uuid from 'uuid/v4.js';
import http from 'http';

const { PORT = 3000 } = process.env;

const server = http.createServer();
const socketMap = {};

polka({ server })
    .all('/*', (req, res) => {
        const subdomain = req.headers['x-forwarded-host'].split('.')[0];
        const generated = uuid();
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
                protocol: req.headers['x-forward-proto'],
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
