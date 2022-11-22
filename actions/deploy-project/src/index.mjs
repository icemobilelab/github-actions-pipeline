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

    const ocDeploymentArgs = ['--namespace', namespace];
    const ocBuildArgs = ['--namespace', BUILD_PROJECT_NAME];

    const pkg = await readFile('package.json');
    const { version } = JSON.parse(pkg);
    const serviceTag = getServiceTag(branchName, version, commitHash);

    if (inMainBranch) {
        await core.group(`Pausing rollouts of dc/${projectName}`,
            async () => {
                try {
                    await oc.pauseRollouts(projectName, ocDeploymentArgs);
                } catch (e) {
                    core.warning('Failed to pause rollouts. Perhaps they\'re already paused?');
                    core.warning(`Command output: ${e.stderr}`);
                }
            });
        await core.group('Tag image as stable', async () => {
            const imageName = `${BUILD_PROJECT_NAME}/${projectName}`;
            await oc.tagImage(`${imageName}:${serviceTag}`, [
                `${imageName}:${branchName}`,
                `${imageName}:${serviceTag}-stable`,
            ], ocBuildArgs);
            await oc.tagImage(`${imageName}:${serviceTag}`, [
                `${namespace}/${projectName}:${serviceTag}`,
            ], ocDeploymentArgs);
        });
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

    if (inMainBranch) {
        await core.group(`Resuming rollouts of dc/${projectName}`,
            async () => {
                try {
                    oc.resumeRollouts(projectName, ocDeploymentArgs);
                } catch (e) {
                    core.warning('Failed to resume rollouts. Perhaps they\'re not paused?');
                    core.warning(`Command output: ${e.stderr}`);
                }
            }
        );
    }

    await core.group(`Wait for ${projectName} to be ready`,
        () => waitForDeployment(projectName, ocDeploymentArgs)
    );

    if (!inMainBranch) {
        await core.group('Cleaning up temporary docker image tags',
            () => oc.del('istag', `${projectName}:${serviceTag}`, ocBuildArgs));
    }
}

await run();
