import { URL } from 'node:url';
import * as core from '@actions/core';
import { clusters } from '../../common/config.mjs';
import { exec } from '../../common/util/exec.mjs';
import * as oc from '../../common/util/oc.mjs';
import { getCurrentProjectName } from '../../common/util/project-info.mjs';
import { BUILD_NAMESPACE } from '../../common/constants.mjs';
import { sleep } from '../../common/util/async.mjs';

const AZURE_CR_DOMAIN = 'eur1cp1psdacr.azurecr.io';
const AZURE_CR_SECRET = 'azurecr';
const DOCKER_CONFIG_KEY = '.dockerconfigjson';
const TST_IMAGE_REGISTRY = `default-route-openshift-image-registry.apps.${clusters.tst.hostname}`;
const TST_IMAGE_NAMESPACE = clusters.tst.defaultNamespace;

async function logIntoAzureCr() {
    const credentials = await getAzureCRCredentials();
    await exec('skopeo', [
        'login',
        '-u', credentials.username,
        '--password-stdin',
        AZURE_CR_DOMAIN,
    ], {
        input: Buffer.from(credentials.password),
    });

    return credentials.username;
}

async function logIntoClusterImageRegistry(cluster) {
    const { stdout } = await oc.command('whoami', ['--token']);
    const token = stdout.trim();
    const username = '_unsused_';
    const clusterRegistry = `default-route-openshift-image-registry.apps.${cluster.hostname}`;
    await exec('skopeo', [
        'login',
        '-u', username,
        '--password-stdin',
        clusterRegistry,
    ], {
        input: Buffer.from(token),
    });

    return username;
}

async function getAzureCRCredentials() {
    const [secret] = await oc.get('secret', AZURE_CR_SECRET, [
        '--namespace', BUILD_NAMESPACE
    ]);

    const dockerConfigJson = Buffer.from(secret[DOCKER_CONFIG_KEY], 'base64');
    const dockerConfig = JSON.parse(dockerConfigJson.toString());
    const {
        username,
        password,
    } = dockerConfig.auths[AZURE_CR_DOMAIN];

    return {
        username,
        password,
    };
}

function getClusterAuthParams(cluster) {
    const apiUrl = new URL(`https://api.${cluster.hostname}`);
    apiUrl.port = 6443;
    return [
        '--server', `${apiUrl.toString()}`,
        '--token', process.env[`ARO_${cluster.clusterId}_AUTH_TOKEN`],
    ];
}

async function promote(project, tag, user, destinationClusters) {
    const azureCrUser = await logIntoAzureCr();
    const tstRegistryUser = await logIntoClusterImageRegistry(clusters.tst);
    const image = `${project}:${tag}`;
    const { stdout } = await exec('date', [], {
        env: {
            TZ: 'Europe/Amsterdam',
        }
    });
    const promotionDate = stdout.trim();
    for (const cluster of destinationClusters) {
        await core.group(`Promote ${image} to ${cluster.name}`, async () => {
            const azureCrImage = `${AZURE_CR_DOMAIN}/${cluster.defaultNamespace}/${image}`;
            core.info('Copying image to Azure CR...');
            await exec('skopeo', [
                'copy',
                `docker://${TST_IMAGE_REGISTRY}/${TST_IMAGE_NAMESPACE}/${image}`,
                `docker://${azureCrImage}`,
                `--src-creds=${tstRegistryUser}`,
                `--dest-creds=${azureCrUser}`,
            ]);

            core.info('Verifying that image is available in Azure CR...');
            for (let i = 0; ; i++) {
                try {
                    await exec('skopeo', [
                        'inspect',
                        azureCrImage,
                        `--creds=${azureCrUser}`,
                    ], { silent: true });

                    break;
                } catch {
                    if (i < 2) {
                        core.info('Image not yet available. Retrying in 5 seconds...');
                        await sleep(5000);
                    } else {
                        throw new Error('Timed out waiting for image to be available in Azure CR');
                    }
                }
            }

            core.info('Importing image to cluster registry...');
            const clusterAuthParams = getClusterAuthParams(cluster);
            for (let i = 0; ; i++) {
                try {
                    await oc.command('import-image', [
                        image,
                        `--from=${azureCrImage}`,
                        '--namespace', cluster.defaultNamespace,
                        '--scheduled',
                        '--confirm',
                        ...clusterAuthParams,
                    ]);

                    break;
                } catch {
                    if (i < 2) {
                        core.info('Failed to import image. Retrying in 5 seconds...');
                        await sleep(5000);
                    } else {
                        throw new Error('Timed out waiting for image to be imported to cluster');
                    }
                }
            }

            await oc.command('annotate', [
                `istag/${image}`,
                `promotion.to.${cluster.env.toUpperCase()}.by="${user} on ${promotionDate}"`,
                '--overwrite=true'
            ]);
        });
    }
}

async function run() {
    const project = getCurrentProjectName();
    const tag = core.getInput('tag', { required: true, }).toLowerCase();
    const cluster = core.getInput('cluster', { required: true, }).toLowerCase();
    const user = core.getInput('user', { required: true, }).toLowerCase();

    const destinationClusters = [];
    if (cluster.startsWith('__')) {
        const env = cluster.replace('__', '');
        destinationClusters.push(
            ...Object.values(clusters).filter(c => c.env === env)
        );
    } else {
        const destinationCluster = clusters[cluster];
        if (!destinationCluster) {
            throw new Error(`Unknown cluster '${cluster}'`);
        }
        destinationClusters.push(destinationCluster);
    }

    await promote(project, tag, user, destinationClusters);
}

await run();
