const client = require('socket.io-client')
const http = require('http');
const io = client('http://localhost:3000');
const fs = require('fs');
const Stream = require('stream').Transform;
const hostname = 'localhost';
const port = 3002;

io.emit('fuck', {fuck: 'fuck'});
io.on('page', (page) => {
    // console.log(page);
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
    const req = http.request(options, (res) => {
        // res.setEncoding('utf8');
        let data = new Stream();
        res.on('data', (chunk) => {
          data.push(chunk);
        });
        res.on('end', () => {
            console.log('ended');
            console.log(data.readableLength);
            const body = data.read();
            io.emit(page.uuid, {body, status: res.statusCode, headers: res.headers});
        });
    });
    req.write(page.body);
    req.end();
})