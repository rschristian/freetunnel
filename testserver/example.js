const express  = require('express');
const app = express();
const cookieParser = require('cookie-parser');
var http = require('http').createServer(app);
const port = 3002;
app.use(cookieParser());
app.use('/static', express.static('static'));
app.use(express.urlencoded());
app.get('/fuck', (req, res) => {
    res.redirect('/shit');
});
app.all('/*', (req, res) => {
    console.log(req.body);
    console.log(req._parsedUrl.path);
    console.log(req.method);
    res.cookie('fucka', 'roo');
    res.set({'yeetus':'feetus'});
    res.status(418).send('Hi kids!');
});
http.listen(port, () => console.log(`Example app listening on port ${port}!`))