import polka from 'polka';
import ejs from 'polka-ejs';
import getPort from 'get-port';
import path from 'path';
import kleur from 'kleur';

export default async (requests, sendPage) => {
    const port = await getPort({ port: 4040 });

    polka()
        .use(
            ejs({
                views: path.join(process.cwd(), 'src/views'),
            }),
            (req, res, next) => {
                next();
            },
        )
        .get('/', (req, res) => {
            res.render('index', { requests });
        })
        .get('/view/:id', (req, res) => {
            res.render('view', { request: requests[req.params.id], id: req.params.id });
        })
        .post('/view/:id', (req, res) => {
            sendPage(requests[req.params.id]);
            res.redirect('/');
        })
        .listen(port, (err) => {
            if (err) throw err;
            console.log(kleur.cyan(`> Debug server @ localhost:${port}`));
        });
};
