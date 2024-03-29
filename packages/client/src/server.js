import path from 'node:path';

import polka from 'polka';
import ejs from 'polka-ejs';

/**
 * @param {FreetunnelResponse[]} requests
 * @param {(request: FreetunnelResponse) => void} sendPage
 */
export default (requests, sendPage) => {
    return polka()
        .use(
            ejs({
                views: path.join(process.cwd(), 'src/views'),
            }),
        )
        .get('/', (_req, res) => {
            res.render('index', { requests });
        })
        .get('/view/:id', (req, res) => {
            res.render('view', { request: requests[req.params.id], id: req.params.id });
        })
        .post('/view/:id', (req, res) => {
            sendPage(requests[req.params.id]);
            res.redirect('/');
        });
};
