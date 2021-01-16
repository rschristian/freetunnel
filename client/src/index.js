import client from 'socket.io-client';
import http from 'http';
import { Transform } from 'stream';

import { localServer } from './server.js';

export default function boot(opts) {
    const io = client(`http://${opts.remote}`);
    const requests = []
    const sendPage = (page) => {
        page = {...page};
        page.time = new Date();
        console.log(page.url, page.method);
        page.headers['X-Forwarded-Proto'] = page.protocol;
        const options = {
            hostname: opts.host,
            port: opts.port,
            path: page.url,
            method: page.method,
            headers: page.headers,
        };
        if (!Object.keys(page.body).length) {
            page.body = Buffer.from('');
        }
        requests.push(page);
        const req = http.request(options, (res) => {
            // res.setEncoding('utf8');
            let data = new Transform();
            res.on('data', (chunk) => {
                data.push(chunk);
            });
            res.on('end', () => {
                const body = data.read();
                page.result = {data: body, status: res.statusCode, headers: res.headers};
                io.emit(page.uuid, {body, status: res.statusCode, headers: res.headers});
            });
        });
        req.write(page.body);
        req.end();
    };
    localServer(requests, sendPage);
    console.log(`Forwarding ${opts.subdomain}.${opts.remote} to ${opts.host}:${opts.port}`);
    io.emit('auth', { subdomain: opts.subdomain });
    io.on('authFail', () => {
        console.log('authentication failed');
        process.exit(1);
    });

    io.on('authSuccess', () => {
        console.log('auth success!');
    });

    io.on('reconnect', () => {
        console.log('reauthenticating...');
        io.emit('auth', { subdomain: opts.subdomain });
    });

    io.on('page', (page) => {
        sendPage(page);
    })
}
