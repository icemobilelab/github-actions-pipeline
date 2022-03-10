'use strict';

const path = require('path');
const core = require('@actions/core');
const { exec } = require('@actions/exec');

const { mergeSwagger } = require('./merge-swagger');
const { writeFile } = require('fs/promises');

const THREESCALE_RC_PATH = '.3scalerc';

async function decodeAndSave3scaleToolboxConfig() {
    const threescaleRc = core.getInput('threescaleRc', {
        required: true
    });

    const decoded = Buffer.from(threescaleRc, 'base64');

    await writeFile(path.join(process.cwd(), '.3scalerc'), decoded);
}

async function importOpenAPISpec(projectName, destinationCluster, systemName) {
    core.startGroup('Import OpenAPI/Swagger spec to 3scale');
    await exec('3scale', [
        '-c', THREESCALE_RC_PATH,
        'import',
        'openapi',
        `--override-private-base-url=http://${projectName}:8080`,
        '-d', destinationCluster,
        '-t', systemName,
        'merged-swagger.json'
    ]);
    core.endGroup();
}

async function promoteProxyConfig(destinationCluster, systemName) {
    core.startGroup('Promote proxy config to 3scale production');
    await exec('3scale', [
        '-c', THREESCALE_RC_PATH,
        'proxy-config',
        'promote',
        destinationCluster,
        systemName
    ]);
    core.endGroup();
}

async function deployTo3scale(options) {
    const {
        swaggerDirectory,
        internalSpecFile,
        publicSpecFile,
        publicAPIBasePath,
        systemName,
        destinationCluster,
        projectName,
    } = options;
    const internalSpecPath = path.join(swaggerDirectory, internalSpecFile);
    const publicSpecPath = path.join(swaggerDirectory, publicSpecFile);

    await mergeSwagger(internalSpecPath, publicSpecPath, publicAPIBasePath);
    await decodeAndSave3scaleToolboxConfig();
    await importOpenAPISpec(projectName, destinationCluster, systemName);
    await promoteProxyConfig(destinationCluster, systemName);
}

module.exports = {
    deployTo3scale
}