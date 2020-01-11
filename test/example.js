const express  = require('express');
const app = express();
const httpi = require('https');
const httpimport = require('http')
const socketio =  require('socket.io');
const uuid = require('uuid/v4');
const port = 3000;
const fs = require('fs');
const socketMap = {};
const options = {
key: fs.readFileSync("/etc/letsencrypt/live/freetunnel.hdimitrov.com-0001/privkey.pem"),
  cert: fs.readFileSync("/etc/letsencrypt/live/freetunnel.hdimitrov.com-0001/cert.pem"),
  chain: fs.readFileSync("/etc/letsencrypt/live/freetunnel.hdimitrov.com-0001/chain.pem"),
};
const http = httpi.createServer(options, app);
const httpold = httpimport.createServer(app);
const io = socketio(httpold)
app.use(express.raw({type: '*/*'}));
app.all('/*', (req, res) => {
    // console.log(req._parsedUrl._raw);
    // console.log(req.headers);
    // console.log(req.body);
    if(req.subdomains.length === 0) {
        req.send('lol');
        return;
    }
    const subdomain = req.subdomains[req.subdomains.length-1];
    const generated = uuid();
    if(socketMap[subdomain]) {
        console.log('the magic socket!');
        socketMap[subdomain].on(generated, (object) => {
            res.set(object.headers);
            res.status(object.status);
            if(object.body) {
                res.write(object.body, 'binary');
            }
            console.log(object.status);
            res.end();
        });
        socketMap[subdomain].emit('page', {url: req._parsedUrl._raw, headers: req.headers, body: req.body, method: req.method, uuid: generated});
    } else {
        res.send('uwu our code moneys are working vewwy hawwd to fwix twis');
    }
});


io.on('connection', (socket) => {
    socket.on('auth', ({subdomain}) => {
        if (socketMap[subdomain]) {
            socket.emit('authFail');
            return;
        }
        socket.emit('authSuccess');
        socketMap[subdomain] = socket;
    });
    socket.on('disconnect', () => {
        Object.entries(socketMap).forEach((entry) => {
            if(entry[1] === socket) {
                delete socketMap[entry[0]];
            }
        })
    })

    //TODO: make it cleanup and not use existing names.
})
httpold.listen(80)
http.listen(443, () => console.log(`Example app listening on port ${port}!`))
