#!/usr/bin/env node
import sade from 'sade';

import tunnel from './index.js';
import pkg from '../package.json';

sade('freetunnel', true)
    .version(pkg.version)
    .describe('Secure introspectable tunnels to localhost. Webhook development and debugging tool.')
    .example('-s rschristian -r freetunnel.hdimitrov.com')
    .example('-s foobar -r tunnel.lukewarlow.uk -p 6000')
    .example('-s api -P password123')
    .option('-s, --subdomain', 'Subdomain to use on remote', 'foo')
    .option('-r, --remote', 'Remote server to run on', 'freetunnel.ryanchristian.dev')
    .option('-H, --host', 'Hostname to bind', 'localhost')
    .option('-p, --port', 'Port to bind', 3000)
    .option('-P, --password', 'Password to use for the remote', undefined)
    .action(tunnel)
    .parse(process.argv);
