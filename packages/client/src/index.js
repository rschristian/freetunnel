import { request } from 'node:http';
import { Transform } from 'node:stream';

import { cyan, green, red, white, yellow } from 'kleur/colors';
import WebSocket from 'ws';

import localServer from './server.js';

/**
 * @param {Options} opts
 */
export default function tunnel(opts) {
    const ws = new WebSocket(`wss://${opts.subdomain}.${opts.remote}`);

    const requests = [];

    /** @param {FreetunnelResponse} resource **/
    const sendPage = (resource) => {
        process.stdout.write(cyan(`• ${resource.method} ${resource.url}\n`));

        resource.time = new Date();

        requests.push(resource);
        const req = request(
            {
                host: opts.host,
                port: opts.port,
                path: resource.url,
                method: resource.method,
                headers: resource.headers,
            },
            (res) => {
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
        if (Object.keys(resource.body).length > 0) {
            req.write(resource.body);
        }
        req.end();
    };

    localServer(requests, sendPage).listen(opts.webPort, (err) => {
        if (err) throw err;
        terminalWrite(opts, false);
    });

    sendMessage(ws, {
        event: 'auth',
        body: { subdomain: opts.subdomain, password: opts.password },
    });
    ws.on('message', (message) => {
        const socketMessage = JSON.parse(message.toString());

        switch (socketMessage.event) {
            case 'authSuccess':
                terminalWrite(opts, true);
                break;
            case 'authFailure':
                process.stdout.write(red(`Authentication failed due to ${socketMessage.message}`));
                process.exit(1);
            case 'resource':
                sendPage(socketMessage.body);
                break;
            case 'hmr':
                new WebSocket(
                    `ws://${opts.host}:${opts.port}${socketMessage.body.url}`,
                    socketMessage.body.headers,
                ).on('message', (message) =>
                    sendMessage(ws, {
                        event: 'hmrUpdate',
                        body: { subdomain: opts.subdomain, message },
                    }),
                );
                break;
            case 'error':
                process.stdout.write(red(`Unknown error: ${socketMessage.message}`));
                break;
        }
    });
}

/**
 * @param {Options} opts
 * @param {boolean} authenticated
 * @returns {void}
 */
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
            `Web Interface          http://127.0.0.1:${opts.webPort}\n` +
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