import { io } from 'socket.io-client';
import http from 'http';
import { Transform } from 'stream';
import kleur from 'kleur';

import localServer from './server.js';

export default function tunnel(opts) {
    const socket = io(`https://${opts.subdomain}.${opts.remote}`);

    const requests = [];
    const sendPage = (resource) => {
        console.log(kleur.white(`    ${resource.method} ${resource.url}`));

        resource.time = new Date();

        if (!resource.body || !Object.keys(resource.body).length > 0) {
            resource.body = Buffer.from('');
        }

        requests.push(resource);
        const req = http.request(
            {
                host: opts.host,
                port: opts.port,
                path: resource.url,
                method: resource.method,
                headers: resource.headers,
            },
            (res) => {
                // res.setEncoding('utf8');
                let data = new Transform();
                res.on('data', (chunk) => data.push(chunk));
                res.on('end', () => {
                    const body = data.read();
                    resource.result = { data: body, status: res.statusCode, headers: res.headers };
                    socket.emit(resource.uuid, { body, status: res.statusCode, headers: res.headers });
                });
            },
        );
        req.write(resource.body);
        req.end();
    };

    localServer(requests, sendPage).catch(console.error);
    console.log(kleur.white().bold(`Forwarding ${opts.subdomain}.${opts.remote} to ${opts.host}:${opts.port}`));

    socket.emit('auth', { subdomain: opts.subdomain });
    socket.on('authSuccess', () => console.log(kleur.green('  Auth success!')));
    socket.on('authFail', () => {
        console.log(kleur.red('  Authentication failed'));
        process.exit(1);
    });

    socket.on('resource', (resource) => sendPage(resource));
}
