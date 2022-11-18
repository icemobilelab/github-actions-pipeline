#!/usr/bin/env node
import console from 'node:console';
import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';
import { promisify } from 'node:util';
import { dirname, extname, resolve, relative, basename } from 'node:path';
import glob from 'glob';
import { build } from 'esbuild';
import rimraf from 'rimraf';
import chalk from 'chalk';

const globAsync = promisify(glob);
const rimrafAsync = promisify(rimraf);

const BASE_DIR = fileURLToPath(new URL('../', import.meta.url));
const distDirs = await globAsync(`${BASE_DIR}/actions/**/dist`);

for (const distDir of distDirs) {
    await rimrafAsync(distDir);
}

try {
    const srcFiles = await globAsync(`${BASE_DIR}/actions/**/src/index.@(js|cjs|mjs)`);
    console.info(chalk.whiteBright.bold(`
Outputs:
--------`));
    let longest = '';
    const builds = await Promise.allSettled(srcFiles.map(async file => {
        const fileName = basename(file);
        const outfile = resolve(dirname(file), '..', 'dist', fileName);
        const relativeInputPath = relative(BASE_DIR, file);
        const relativeOutputPath = relative(BASE_DIR, outfile);
        longest = relativeInputPath.length > longest.length ? relativeInputPath : longest;
        const ext = extname(file);
        const format = ext === '.mjs' ? 'esm' : 'cjs';

        try {
            await build({
                entryPoints: [file],
                treeShaking: true,
                bundle: true,
                minify: true,
                outfile: outfile,
                platform: 'node',
                format,
                // Fix for modules that dynamically require builtin node modules.
                // From https://github.com/evanw/esbuild/issues/1944#issuecomment-1022886747
                banner: {
                    js: format === 'esm' ? [
                        'import { createRequire as topLevelCreateRequire } from \'module\'',
                        'const require = topLevelCreateRequire(import.meta.url)'
                    ].join(';') : ''
                },
            });
            return { relativeInputPath, relativeOutputPath };
        } catch (e) {
            let error = new Error(e.message);
            Object.assign(error, { relativeInputPath, relativeOutputPath });
            throw error;
        }
    }));

    const errors = [];
    for (const build of builds) {
        let icon, color, input, output;
        if (build.status === 'fulfilled') {
            color = chalk.greenBright;
            icon = '\u2714'; // Heavy Check Mark
            input = build.value.relativeInputPath;
            output = build.value.relativeOutputPath;
        } else {
            color = chalk.redBright;
            icon = '\u274C'; // Cross Mark
            input = build.reason.relativeInputPath;
            output = build.reason.relativeOutputPath;
            errors.push(build.reason);
        }
        const left = ' '.repeat(longest.length - input.length) + input;
        const right = color(`${icon} ${output}`);
        console.info(`${left}: ${right}`);
    }
    if (errors.length) {
        console.info(chalk.whiteBright.bold(`
Errors:
-------`));
        for (const error of errors) {
            console.error(`${chalk.redBright(error.relativeInputPath)}: ${error.message.replace(/\n/g, '\n    ')}`);
        }
        process.exit(1);
    }
} catch (err) {
    console.error(err);
    process.exit(1);
}
