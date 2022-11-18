import { readFile } from 'node:fs/promises';
import * as core from '@actions/core';
import {
    BUILD_PROJECT_NAME,
    WORKSPACE_DIRECTORY,
} from '../../common/constants.mjs';
import {
    getCurrentBranchName,
    getCurrentProjectName,
    getServiceTag,
    getShortCommitHash,
    isMainBranch,
} from '../../common/util/project-info.mjs';
import * as oc from '../../common/util/oc.mjs';
import { awaitWithTimeout } from '../../common/util/async.js';
import { deployGitHubProject, waitForDeployment } from '../../common/util/deployment.mjs';

const TIMEOUT = 300_000;

async function run() {
    const projectName = getCurrentProjectName();
    const branchName = getCurrentBranchName();
    const commitHash = getShortCommitHash();
    const inMainBranch = isMainBranch(branchName);
    const namespace = core.getInput('namespace');
    const ansibleVaultPasswordFile = core.getInput('ansible-vault-password-file');

    const ocDeploymentArgs = [
        '--namespace', namespace,
    ];

    const pkg = await readFile('package.json');
    const { version } = JSON.parse(pkg);
    const serviceTag = getServiceTag(branchName, version, commitHash);

    if (inMainBranch) {
        await core.group(`Pausing rollouts of dc/${projectName}`, () => oc.pauseRollouts(projectName));
    }

    await core.group(`Deploy ${projectName}`,
        () => awaitWithTimeout(deployGitHubProject(
            WORKSPACE_DIRECTORY,
            projectName,
            branchName,
            version,
            namespace,
            ansibleVaultPasswordFile,
            ocDeploymentArgs
        ), TIMEOUT)
    );

    await core.group(`Wait for ${projectName} to be ready`,
        () => waitForDeployment(projectName, ocDeploymentArgs)
    );

    if (inMainBranch) {
        await core.group('Tag image as stable', async () => {
            const imageName = `${BUILD_PROJECT_NAME}/${projectName}`;
            await oc.tagImage(`${imageName}:${serviceTag}`, [
                `${imageName}:${branchName}`,
                `${imageName}:${serviceTag}-stable`
            ], ['--namespace', BUILD_PROJECT_NAME]);
        });
    }
}

await run();
