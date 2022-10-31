import path from 'node:path';
import * as core from '@actions/core';
import { exec } from '@actions/exec';
import { writeFile } from 'fs/promises';
import { mergeSwagger } from './merge-swagger.mjs';
import * as oc from '../../common/util/oc.mjs';

const THREESCALE_RC_PATH = '.3scalerc';
const TOOLBOX_SECRET_NAME = '3scale-toolbox';
const TOOLBOX_SECRET_NAMESPACE = 'cicd';
const TOOLBOX_SECRET_KEY = '.3scalerc.yaml';

async function downloadAndDecode3scaleToolboxConfig() {
    await core.group('Download 3scale-toolbox config', async () => {
        const secret = await oc.get('secrets', TOOLBOX_SECRET_NAME, [
            '--namespace',
            TOOLBOX_SECRET_NAMESPACE,
            '-o', 'json'
        ]);

        const secretJson = JSON.parse(secret);
        const threescaleRc = secretJson.data[TOOLBOX_SECRET_KEY];
        const decoded = Buffer.from(threescaleRc, 'base64');

        await writeFile(THREESCALE_RC_PATH, decoded);

        core.info(`Saved 3scale-toolbox config to '${THREESCALE_RC_PATH}'.`);
    });

    return THREESCALE_RC_PATH;
}

async function importOpenAPISpec(configPath, openApiSpec, projectName, destinationCluster, systemName) {
    await core.group('Import OpenAPI/Swagger spec to 3scale',
        () => exec('3scale', [
            '-c', configPath,
            'import',
            'openapi',
            `--override-private-base-url=http://${projectName}:8080`,
            '-d', destinationCluster,
            '-t', systemName,
            openApiSpec
        ]));
}

async function promoteProxyConfig(configPath, destinationCluster, systemName) {
    await core.group('Promote proxy config to 3scale production', async () => {
        await exec('3scale', [
            '-c', configPath,
            'proxy',
            'deploy',
            destinationCluster,
            systemName
        ]);

        await exec('3scale', [
            '-c', THREESCALE_RC_PATH,
            'proxy-config',
            'promote',
            destinationCluster,
            systemName
        ]);
    });
}

export async function deployTo3scale(options) {
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

    const mergedSwagger = await mergeSwagger(internalSpecPath, publicSpecPath, publicAPIBasePath);
    const toolboxConfig = await downloadAndDecode3scaleToolboxConfig();

    await importOpenAPISpec(toolboxConfig, mergedSwagger, projectName, destinationCluster, systemName);
    await promoteProxyConfig(toolboxConfig, destinationCluster, systemName);
}
