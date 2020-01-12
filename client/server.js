const portfinder = require('portfinder')
const call = async (requests, sendPage) => {
    const app = require('express')();
    const port = await portfinder.getPortPromise({port: 4040});

    app.set('view engine', 'hbs');
    app.set('views', __dirname + '/views');
    app.get('/', (req, res) => {
        res.render('index', {requests});
    });
    app.get('/view/:id', (req, res) => {
        res.render('view', {request: requests[req.params.id], id: req.params.id});
    });
    app.post('/view/:id', (req, res) => {
        sendPage(requests[req.params.id]);
        res.redirect('/');
    });

    console.log(`Debug server @ localhost:${port}`);
    app.listen(port);
}

module.exports = call;