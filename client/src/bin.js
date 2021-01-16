#!/usr/bin/env node
import sade from 'sade';

import boot from './index.js'
import pkg from '../package.json';

sade('freetunnel', true)
    .version(pkg.version)
    .describe('COME BACK')
        .example('-r freetunnel.hdimitrov.com -s rschristian')
        .example('-r tunnel.lukewarlow.uk -s foobar -p 6000')
    .option('-r, --remote', 'Remote server to run on', 'freetunnel.hdimitrov.com')
    .option('-s, --subdomain', 'Subdomain to use on remote')
    .option('-H, --host', 'Hostname to bind', 'localhost')
    .option('-p, --port', 'Port to bind', 5000)
    .action(boot)
    .parse(process.argv);
