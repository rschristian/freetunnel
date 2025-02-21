#!/usr/bin/env node
import { promises as fs } from 'fs';

import sade from 'sade';

import tunnel from './index.js';
import validateOptions from './validateOptions.js';

const pkg = JSON.parse(await fs.readFile('./package.json', 'utf-8'));

sade('freetunnel', true)
    .version(pkg.version)
    .describe('Create secure introspectable tunnels to your local device with a single command')
    .option('-s, --subdomain', 'Subdomain to use on remote', 'my-app')
    .option('-r, --remote', 'Remote server to run on', 'freetunnel.ryanchristian.dev')
    .option('-H, --host', 'Hostname to bind', 'localhost')
    .option('-p, --port', 'Port to bind', 3000)
    .option('-w, --web-port', 'Web Port to bind for introspection', 4040)
    .example('-s rschristian -r freetunnel.example.com')
    .example('-s foobar -r tunnel.foo.uk -p 6000')
    .action((opts) => {
        opts = validateOptions(opts);
        tunnel(opts);
    })
    .parse(process.argv, {
        unknown: (arg) => `Unknown option: ${arg}`,
    });
