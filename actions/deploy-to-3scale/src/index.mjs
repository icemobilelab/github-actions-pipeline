import process from 'node:process';
import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import { exec } from '../../common/util/exec.mjs';

import { extract3scaleConfig } from './extract-3scale-config.mjs';
import { deployTo3scale } from './deploy-to-3scale.mjs';

const VERSION = '0.20.0';
const CACHE_FILENAME = '3scale.deb';
const CACHE_KEY = `3scale-${VERSION}`;
// eslint-disable-next-line max-len
const THREESCALE_TOOLBOX_URL = `https://github.com/3scale-labs/3scale_toolbox_packaging/releases/download/v${VERSION}/3scale-toolbox_${VERSION}-1_amd64.deb`;

async function run() {
    const cluster = core.getInput('cluster', {
        required: true
    });

    const threescaleConfig = await extract3scaleConfig(cluster);

    if (threescaleConfig.deploy) {
        const projectName = process.env.GITHUB_REPOSITORY.split('/')[1];

        await install3scaleToolbox();
        await deployTo3scale({
            swaggerDirectory: core.getInput('swagger-directory', { required: true }),
            internalSpecFile: core.getInput('internal-spec-file') || `${projectName}.yml`,
            publicSpecFile: core.getInput('public-spec-file', { required: true }),
            publicAPIBasePath: threescaleConfig.publicBasePath,
            systemName: threescaleConfig.systemName,
            destinationCluster: threescaleConfig.threescaleDestinationCluster,
            projectName,
        });
    }
}

async function install3scaleToolbox() {
    await core.group('Install 3scale toolbox...', async () => {
        let cached = tc.find(CACHE_KEY, VERSION);
        if (!cached) {
            core.info(`3scale toolbox v${VERSION} not found in cache. Downloading...`);
            const toolbox = await tc.downloadTool(THREESCALE_TOOLBOX_URL);
            cached = await tc.cacheFile(toolbox, CACHE_FILENAME, CACHE_KEY, VERSION);
            core.info(`3scale toolbox v${VERSION} downloaded and cached`);
        }

        core.info(`Installing 3scale toolbox v${VERSION}...`);

        await exec('bash', [
            '-c',
            `sudo dpkg -i "${cached}/${CACHE_FILENAME}"`
        ], {
            silent: true
        });

        core.info(`3scale toolbox v${VERSION} installed!`);
    });
}

await run();
