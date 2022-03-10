'use strict';

const { basename } = require('path');
const core = require('@actions/core');
const exec = require('@actions/exec');

const { extract3scaleConfig } = require('./extract-3scale-config');
const { deployTo3scale } = require('./deploy-to-3scale');


async function run() {
    const cluster = core.getInput('cluster', {
        required: true
    });

    const threescaleConfig = await extract3scaleConfig(cluster);

    if (threescaleConfig.deploy) {
        // Hack to get project name. basename('@icemobilelab/some-repo') will return 'some-repo'
        const projectName = basename(process.env.GITHUB_REPOSITORY);

        await install3scaleToolbox();
        await deployTo3scale({
            swaggerDirectory: core.getInput('swaggerDirectory', { required: true }),
            internalSpecFile: core.getInput('internalSpecFile') || `${projectName}.yml`,
            publicSpecFile: core.getInput('publicSpecFile', { required: true }),
            publicAPIBasePath: threescaleConfig.publicBasePath,
            systemName: threescaleConfig.systemName,
            destinationCluster: threescaleConfig.threescaleDestinationCluster,
            projectName,
        });
    }
}

async function install3scaleToolbox() {
    core.startGroup('Install 3scale toolbox...');
    core.info('Installing 3scale toolbox...');
    await exec.exec('bash', [
        '-c',
        'sudo apt update &> /dev/null && sudo apt install -y ruby &> /dev/null && gem install -N --minimal-deps -q --silent 3scale_toolbox'
    ]);
    core.endGroup();
}

run();
