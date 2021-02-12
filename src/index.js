import WebSocket from 'ws';
import http from 'http';
import { Transform } from 'stream';
import { cyan, green, red, white, yellow } from 'kleur/colors';

import localServer from './server.js';

const { FREETUNNEL_WEB_PORT = 4040 } = process.env;

/**
 * @param {{ subdomain: string, remote: string, host: string, port: number, password: string }} opts
 */
export default function tunnel(opts) {
    const ws = new WebSocket(`wss://${opts.subdomain}.${opts.remote}`);

    const requests = [];
    const sendPage = (resource) => {
        process.stdout.write(cyan(`• ${resource.method} ${resource.url}\n`));

        resource.time = new Date();

        if (!Object.keys(resource.body).length > 0) {
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
                    sendMessage(ws, {
                        event: resource.uuid,
                        body: { body, status: res.statusCode, headers: res.headers },
                    });
                });
            },
        );
        req.on('error', (e) => {
            process.stdout.write(red(`Problem with request: ${e.message}\n`));
            sendMessage(ws, {
                event: resource.uuid,
                body: { body: `Problem with request: ${e.message}\n`, status: 502 },
            });
        });
        req.write(resource.body);
        req.end();
    };

    localServer(requests, sendPage).listen(FREETUNNEL_WEB_PORT, (err) => {
        if (err) throw err;
        terminalWrite(opts, false);
    });

    sendMessage(ws, { event: 'auth', body: { subdomain: opts.subdomain, password: opts.password } });
    ws.on('message', (message) => {
        const socketMessage = JSON.parse(message);

        switch (socketMessage.event) {
            case 'authSuccess':
                terminalWrite(opts, true);
                break;
            case 'authFailure':
                process.stdout.write(red(`Authentication failed due to ${socketMessage.message}`));
                process.exit(1);
                break;
            case 'resource':
                sendPage(socketMessage.body);
                break;
            case 'hmr':
                new WebSocket(`ws://${opts.host}:${opts.port}${socketMessage.body.url}`, socketMessage.body.headers)
                    .on('message', (message) =>
                        sendMessage(ws, { event: 'hmrUpdate', body: { subdomain: opts.subdomain, message } }),
                    )
                    .on('error', (error) => console.log(error));
                break;
            case 'error':
                process.stdout.write(red(`Unknown error: ${socketMessage.message}`));
                break;
        }
    });
}

function terminalWrite(opts, authenticated) {
    process.stdout.write('\x1B[H\x1B[2J');
    process.stdout.write(yellow('FreeTunnel\n\n'));
    // prettier-ignore
    process.stdout.write(
        (authenticated
                ? green('Status                 Authenticated\n')
                : red('Status                 Unauthenticated\n')
        ) +
        white(
            `Web Interface          http://127.0.0.1:${FREETUNNEL_WEB_PORT}\n` +
            `Forwarding             http://${opts.subdomain}.${opts.remote} -> http://${opts.host}:${opts.port}\n` +
            `Forwarding             https://${opts.subdomain}.${opts.remote} -> http://${opts.host}:${opts.port}\n\n`
        ),
    );
}

function sendMessage(ws, message) {
    waitForSocketConnection(ws, () => {
        ws.send(JSON.stringify(message));
    });
}

function waitForSocketConnection(ws, callback) {
    setTimeout(() => {
        if (ws.readyState === 1) {
            if (callback) callback();
        } else {
            waitForSocketConnection(ws, callback);
        }
    }, 5);
}
