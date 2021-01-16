import polka from 'polka';
import ejs from 'polka-ejs';
import getPort from 'get-port';

export const localServer = async (requests, sendPage) => {
    const port = await getPort({ port: 4040 });

    polka()
        .use(ejs(), (req, res, next) => {
            res.setHeader('Content-Type', 'text/html');
            next();
        })
        .get('/', (req, res) => {
            res.render('index', { requests })
        })
        .get('/view/:id', (req, res) => {
            res.render('view', { request: requests[req.params.id], id: req.params.id })
        })
        .post('/view/:id', (req, res) => {
            sendPage(requests[req.params.id]);
            res.redirect('/');
        })
        .listen(port, (err) => {
            if (err) throw err;
            console.log(`> Debug server @ localhost:${port}`);
        })
}
