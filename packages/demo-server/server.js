import polka from 'polka';
import redirect from '@polka/redirect';
import { json } from '@polka/parse';
import sirv from 'sirv';
import cookie from 'cookie';
import http from 'http';

const { PORT = 3001 } = process.env;

const server = http.createServer();

function parseCookies(req, res, next) {
    const cookies = cookie.parse(req.headers.cookie || '');
    req.name = cookies.name;
    next();
}

polka({ server })
    .use(json(), parseCookies, sirv('static'))
    .get('/example', (req, res) => {
        redirect(res, '/home');
    })
    .all('/*', (req, res) => {
        console.log(req.body);
        console.log(`Path: ${req._parsedUrl.path}`);
        console.log(`Method: ${req.method}`);
        console.log(`Cookie Value: ${req.name}`);
        res.setHeader(
            'Set-Cookie',
            cookie.serialize('name', 'Ryun', {
                httpOnly: true,
                maxAge: 60 * 60 * 24 * 7,
            }),
        );
        res.writeHead(418, { foo: 'bar' });
        res.body = 'foobarbaz';
        res.end('Lorem Ipsum');
    })
    .listen(PORT, (err) => {
        if (err) throw err;
        console.log(`> Running on localhost:${PORT}`);
    });
