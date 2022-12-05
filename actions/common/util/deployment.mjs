import path from 'node:path';
import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import * as core from '@actions/core';
import { exec } from '../../common/util/exec.mjs';
import * as oc from './oc.mjs';
import { decryptAnsibleVault } from './ansible-vault.mjs';
import { getServiceTag, getShortCommitHash } from './project-info.mjs';
import {
    BUILD_NAMESPACE,
    OPENSHIFT_TEMPLATES_PATH,
    TEMPLATE_PARAMETERS_DIRECTORY_NAME
} from '../constants.mjs';

async function deployGitHubProject(
    baseDirectory, dependencyName, branch, projectVersion, namespace, ansibleVaultPasswordFile, ocArgs) {
    const dependencyDirectory = path.join(baseDirectory, dependencyName);
    const templatesDirectory = path.join(dependencyDirectory, OPENSHIFT_TEMPLATES_PATH);
    const parametersDirectory = path.join(templatesDirectory, TEMPLATE_PARAMETERS_DIRECTORY_NAME);
    const templates = await readdir(templatesDirectory);

    let deployTemplate;
    try {
        for await (const template of templates) {
            const extension = path.extname(template);
            const resource = path.basename(template, extension);
            if (resource === 'deploy_template') {
                deployTemplate = template;
                continue;
            }
            if (resource !== 'build_template'
                && (extension === '.yml' || extension === '.yaml')) {
                let envFilePath = path.join(parametersDirectory, `${resource}_PIPELINE.env`);
                if (!existsSync(envFilePath)) {
                    envFilePath = path.join(parametersDirectory, `${resource}_TST.env`);
                    if (!existsSync(envFilePath)) {
                        envFilePath = null;
                    }
                }

                if (envFilePath) {
                    await decryptAnsibleVault(ansibleVaultPasswordFile, envFilePath);
                }
                await deployTemplatedResource(path.join(templatesDirectory, template), envFilePath, ocArgs);
            }
        }

        if (!branch) {
            const { stdout } = await exec('git', [
                'branch', '--show-current'
            ], {
                cwd: dependencyDirectory,
                silent: true,
            });

            branch = stdout.trim();
            projectVersion = branch;
        }

        await deployService(
            namespace,
            dependencyName,
            branch,
            projectVersion,
            path.join(templatesDirectory, deployTemplate),
            ocArgs
        );
    } catch (e) {
        core.error(`Failed while deploying dependency: '${dependencyName}'`);
        core.error(e);
        throw e;
    }
}

async function deployService(namespace, projectName, branch, projectVersion, templatePath, ocArgs) {
    const imageName = `${BUILD_NAMESPACE}/${projectName}`;
    const commitHash = getShortCommitHash();
    const serviceTag = getServiceTag(branch, projectVersion, commitHash);

    await oc.tagImage(`${imageName}:${serviceTag}`, `${namespace}/${projectName}:${serviceTag}`, ocArgs);

    const deploymentConfig = await oc.process(templatePath, {
        NAME: projectName,
        NAMESPACE: namespace,
        SERVICE_TAG: serviceTag,
    }, [
        '--ignore-unknown-parameters',
        '-l', `template=${projectName}`,
    ]);

    await oc.applyFromResourceDefinitionString(deploymentConfig, ocArgs);
}

async function deployTemplatedResource(templatePath, envFilePath, ocArgs) {
    core.debug(`Deploying ${templatePath} with ${envFilePath ? `env ${envFilePath} and` : ''} ${ocArgs}`);
    const resourceDefinition = await oc.process(templatePath, {}, [
        '--ignore-unknown-parameters',
        ...(envFilePath ? [`--param-file=${envFilePath}`] : [])
    ]);

    await oc.applyFromResourceDefinitionString(resourceDefinition, ocArgs);
}

async function waitForDeployment(projectName, ocArgs) {
    await oc.waitForRollout(projectName, ocArgs);
}

export {
    deployGitHubProject,
    deployService,
    deployTemplatedResource,
    waitForDeployment,
};
