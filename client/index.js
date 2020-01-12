#!/usr/bin/env node

const client = require('socket.io-client')
const http = require('http');
const Stream = require('stream').Transform;
const localServer = require('./server');
const { server, hostname, port, subdomain } = require('minimist')(process.argv.slice(2));
const io = client(`http://${server}`);
const fs = require('fs');


const requests = []
const sendPage = (page) => {
    page = {...page};
    page.time = new Date();
    console.log(page.url, page.method);
    const options = {
        hostname,
        port,
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
        let data = new Stream();
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
console.log(`Forwarding ${subdomain}.${server} to ${hostname}:${port}`);
io.emit('auth', {subdomain});
io.on('authFail', () => {
    console.log('authentication failed');
    process.exit(1);
});

io.on('authSuccess', () => {
    console.log('auth success!');
});

io.on('reconnect', () => {
    console.log('reauthenticating...');
    io.emit('auth', {subdomain});
});

io.on('page', (page) => {
   sendPage(page);
})