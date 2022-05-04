import { red } from 'kleur/colors';

/**
 * @param {Options} opts
 * @returns {Options}
 */
export default function validateOptions(opts) {
    // Sade doesn't provide helpers to de-kebab, so needs to be done manually
    opts.webPort = opts['web-port'];

    try {
        if (typeof opts.port !== 'number') throw ['port', 'not a number'];
        if (typeof opts.webPort !== 'number') throw ['web-port', 'not a number'];
    } catch (err) {
        process.stdout.write(red(`\nInvalid option passed to --${err[0]}: ${err[1]}\n\n`));
        process.exit(1);
    }

    return opts;
}
