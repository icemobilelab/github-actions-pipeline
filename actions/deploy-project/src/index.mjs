import { readFile } from 'node:fs/promises';
import * as core from '@actions/core';
import {
    WORKSPACE_DIRECTORY,
} from '../../common/constants.mjs';
import {
    getCurrentBranchName,
    getCurrentProjectName,
} from '../../common/util/project-info.mjs';
import { awaitWithTimeout } from '../../common/util/async.js';
import { deployGitHubProject, waitForDeployment } from '../../common/util/deployment.mjs';

const TIMEOUT = 300_000;

async function run() {
    const projectName = getCurrentProjectName();
    const branchName = getCurrentBranchName();
    const namespace = core.getInput('namespace');
    const ansibleVaultPasswordFile = core.getInput('ansible-vault-password-file');

    const ocArgs = [
        '--namespace', namespace,
    ];

    const pkg = await readFile('package.json');
    const { version } = JSON.parse(pkg);

    await core.group(`Deploy ${projectName}`,
        () => awaitWithTimeout(deployGitHubProject(
            WORKSPACE_DIRECTORY,
            projectName,
            branchName,
            version,
            namespace,
            ansibleVaultPasswordFile,
            ocArgs
        ), TIMEOUT)
    );

    await core.group(`Wait for ${projectName} to be ready`,
        () => waitForDeployment(projectName, ocArgs)
    );
}

await run();
