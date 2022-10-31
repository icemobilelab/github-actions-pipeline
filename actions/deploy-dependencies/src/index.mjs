import path from 'node:path';
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as core from '@actions/core';
import {
    deployCommonResources,
} from './util.mjs';
import {
    WORKSPACE_DIRECTORY,
} from '../../common/constants.mjs';
import {
    getCurrentBranchName,
    getCurrentProjectName,
} from '../../common/util/project-info.mjs';
import { awaitWithTimeout } from '../../common/util/async.js';
import { deployGitHubProject, deployTemplatedResource, waitForDeployment } from '../../common/util/deployment.mjs';
import { cloneGithubDependency } from '../../common/util/git.mjs';

const ACTION_TEMPLATES_PATH = fileURLToPath(new URL('../templates', import.meta.url));
const TIMEOUT = 300_000;

async function run() {
    const projectName = getCurrentProjectName();
    const branchName = getCurrentBranchName();
    const namespace = core.getInput('namespace');
    const templates = await readdir(ACTION_TEMPLATES_PATH);
    const ansibleVaultPasswordFile = core.getInput('ansible-vault-password-file');

    const ocArgs = [
        '--namespace', namespace,
    ];

    const deployedDependencies = new Set();
    const seenDependencies = new Set();
    const dependencyStack = [`${projectName}:${branchName}`];

    let dependency;
    core.debug(`Available templates: ${templates}`);
    try {
        await core.group('Deploy common resources',
            () => deployCommonResources(ACTION_TEMPLATES_PATH, namespace, 'dev', ocArgs)
        );
    } catch (e) {
        core.error('Error deploying common resources');
        core.error(e);
        throw e;
    }

    while (dependency = dependencyStack.pop()) {
        core.debug(`Dependency stack: \n\t${dependencyStack.join('\n\t')}`);
        core.debug(`Current dependency: ${dependency}`);
        const [dependencyName, dependencyRef] = dependency.split(':');
        if (!deployedDependencies.has(dependencyName)) {
            if (templates.includes(`${dependencyName}-deployment-template.yml`)) {
                core.info(`Deploying ${dependencyName}...`);
                deployedDependencies.add(dependencyName);
                try {
                    await core.group(`Deploy ${dependencyName}`,
                        () => awaitWithTimeout(deployTemplatedResource(
                            path.join(ACTION_TEMPLATES_PATH, `${dependencyName}-deployment-template.yml`),
                            null,
                            ocArgs,
                        ), TIMEOUT)
                    );
                } catch (e) {
                    core.error(`Failed while deploying dependency: '${dependencyName}'`);
                    core.error(e);
                    throw e;
                }
            } else {
                if (!seenDependencies.has(dependencyName)) {
                    seenDependencies.add(dependencyName);

                    if (dependencyName !== projectName) {
                        await core.group(`Clone ${dependencyName}`,
                            () => cloneGithubDependency(dependencyName, dependencyRef, WORKSPACE_DIRECTORY)
                        );
                    }

                    const packageJson = path.join(WORKSPACE_DIRECTORY, dependencyName, 'package.json');
                    if (existsSync(packageJson)) {
                        core.debug(`${dependencyName} has package.json`);
                        const pkg = await readFile(packageJson);
                        const { upstreamDependencies = [] } = JSON.parse(pkg);
                        if (upstreamDependencies.length) {
                            core.debug(`${dependencyName} has deps: \n\t${upstreamDependencies.join('\n\t')}`);
                            dependencyStack.push(
                                `${dependency}${dependencyRef ? `:${dependencyRef}` : ''}`,
                                ...upstreamDependencies
                            );
                            continue;
                        }
                    }
                }

                if (dependencyName !== projectName) {
                    deployedDependencies.add(dependencyName);
                    await core.group(`Deploy ${dependencyName}`,
                        () => awaitWithTimeout(deployGitHubProject(
                            WORKSPACE_DIRECTORY,
                            dependencyName,
                            dependencyRef,
                            dependencyRef,
                            namespace,
                            ansibleVaultPasswordFile,
                            ocArgs
                        ), TIMEOUT)
                    );
                }
            }
        }
    }

    for (const dependency of deployedDependencies) {
        await core.group(`Wait for ${dependency} to be ready`,
            () => waitForDeployment(dependency, ocArgs)
        );
    }
}

await run();
