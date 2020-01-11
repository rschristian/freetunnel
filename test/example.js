const express  = require('express');
const app = express();
var http = require('http').createServer(app);
const io =  require('socket.io')(http);
const uuid = require('uuid/v4');
const port = 3000;
const fs = require('fs');

let themagicsocket = null;

app.use(express.raw({type: '*/*'}));
app.all('/*', (req, res) => {
    // console.log(req._parsedUrl._raw);
    // console.log(req.headers);
    // console.log(req.body);
    const generated = uuid();
    if(themagicsocket) {
        console.log('the magic socket!');
        themagicsocket.on(generated, (object) => {
            res.set(object.headers);
            res.status(object.status);
            if(object.body) {
                res.write(object.body, 'binary');
            }
            console.log(object.status);
            res.end();
        });
        themagicsocket.emit('page', {url: req._parsedUrl._raw, headers: req.headers, body: req.body, method: req.method, uuid: generated});
    } else {
        res.send('uwu our code moneys are working vewwy hawwd to fwix twis');
    }
});


io.on('connection', (socket) => {
    themagicsocket = socket
})

http.listen(port, () => console.log(`Example app listening on port ${port}!`))