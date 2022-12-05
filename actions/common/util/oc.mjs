import core from '@actions/core';
import { exec } from './exec.mjs';

/**
 * @param {string} server The OpenShift server API URL
 * @param {string} token The OpenShift auth token
 * @returns {Promise.<import('@actions/exec').ExecOutput>}
 */
async function login(server, token) {
    return exec('oc', [
        'login',
        '--server', server,
        '--token', token,
    ]);
}

async function tagImage(image, tags, additionalArgs = []) {
    const args = [
        'tag',
        image,
    ];

    if (Array.isArray(tags)) {
        args.push(...tags);
    } else {
        args.push(tags);
    }

    if (Array.isArray(additionalArgs) && additionalArgs.length > 0) {
        args.push(...additionalArgs);
    }

    return exec('oc', args);
}

async function startBuild(buildName, followLogs = true, additionalArgs = []) {
    const args = [
        'start-build', buildName,
        ...(followLogs ? ['-F'] : []),
    ];

    if (followLogs) {
        args.push('-F');
    }

    if (Array.isArray(additionalArgs) && additionalArgs.length > 0) {
        args.push(...additionalArgs);
    }

    return exec('oc', args);
}

async function process(templatePath, parameters = {}, additionalArgs = []) {
    const args = [
        'process', '--local',
        '-f', templatePath,
    ];

    for (const [key, value] of Object.entries(parameters)) {
        args.push('-p', `${key}=${value}`);
    }

    if (Array.isArray(additionalArgs) && additionalArgs.length > 0) {
        args.push(...additionalArgs);
    }

    core.debug(`oc ${args.join(' ')}`);

    const { stdout: resourceDefinition } = await exec('oc', args, {
        silent: true,
    });

    return resourceDefinition;
}

async function applyFromResourceDefinitionString(resourceDefinition, additionalArgs = []) {
    const args = [
        'apply',
    ];

    if (Array.isArray(additionalArgs) && additionalArgs.length > 0) {
        args.push(...additionalArgs);
    }

    args.push('-f', '-');

    return exec('oc', args, {
        input: Buffer.from(resourceDefinition),
    });
}

async function waitForRollout(deploymentConfig, additionalArgs = []) {
    const args = [
        'rollout',
        'status',
        '-w',
        `dc/${deploymentConfig}`,
    ];

    if (Array.isArray(additionalArgs) && additionalArgs.length > 0) {
        args.push(...additionalArgs);
    }

    return exec('oc', args);
}

async function pauseRollouts(deploymentConfig, additionalArgs = []) {
    const args = [
        'rollout',
        'pause',
        `dc/${deploymentConfig}`,
    ];

    if (Array.isArray(additionalArgs) && additionalArgs.length > 0) {
        args.push(...additionalArgs);
    }

    return exec('oc', args);
}

async function resumeRollouts(deploymentConfig, additionalArgs = []) {
    const args = [
        'rollout',
        'resume',
        `dc/${deploymentConfig}`,
    ];

    if (Array.isArray(additionalArgs) && additionalArgs.length > 0) {
        args.push(...additionalArgs);
    }

    return exec('oc', args);
}

/**
 * Fetches a list of resource names from the cluster
 *
 * @param {string} resourceType The resource type to fetch
 * @param {string[]} additionalArgs Additional arguments to the `oc get` command
 * @returns {Promise<string[]>} A list of the names of found resources
 */
async function getNames(resourceType, additionalArgs = []) {
    const args = [
        'get',
        resourceType,
        '-o', 'name'
    ];

    if (Array.isArray(additionalArgs) && additionalArgs.length > 0) {
        args.push(...additionalArgs);
    }

    const { stdout } = await exec('oc', args, {
        silent: true
    });

    return stdout.trim().split('\n');
}

/**
 * Fetches one or more resources from the cluster as JSON
 *
 * @param {string} resourceType The resource type to fetch
 * @param {string} [resourceName] The resource name to fetch. If missing, will fetch
 *  all resources of the specified type
 * @param {string[]} additionalArgs Additional arguments to the `oc get` command, e.g.
 *  labels by which to filter
 * @returns {Promise<Object[]>} A list of the resources found
 */
async function get(resourceType, resourceName, additionalArgs = []) {
    const args = [
        'get',
        resourceType,
        ...(resourceName ? [resourceName] : []),
    ];

    if (Array.isArray(additionalArgs) && additionalArgs.length > 0) {
        args.push(...additionalArgs);
    }

    args.push('-o', 'json');

    const { stdout } = await exec('oc', args, {
        silent: true
    });

    const results = JSON.parse(stdout.trim());

    if (results.kind === 'List') {
        return results.items;
    }

    return [results];
}

async function logs(resource, follow = false, print = false, additionalArgs = []) {
    const args = [
        'logs',
        resource
    ];

    if (follow) {
        args.push('-f');
    }

    if (Array.isArray(additionalArgs) && additionalArgs.length > 0) {
        args.push(...additionalArgs);
    }

    const { stdout } = await exec('oc', args, {
        silent: !print
    });

    return stdout;
}

async function deleteResource(resourceType, resourceName, additionalArgs = []) {
    const args = [
        'delete',
        resourceType,
        resourceName,
    ];

    if (Array.isArray(additionalArgs) && additionalArgs.length > 0) {
        args.push(...additionalArgs);
    }

    return exec('oc', args);
}

async function newProject(projectName, additionalArgs = []) {
    const args = [
        'new-project',
        projectName,
    ];

    if (Array.isArray(additionalArgs) && additionalArgs.length > 0) {
        args.push(...additionalArgs);
    }

    return exec('oc', args);
}

async function addRoleToGroup(role, group, additionalArgs = []) {
    const args = [
        'adm',
        'policy',
        'add-role-to-group',
        role,
        group,
    ];

    if (Array.isArray(additionalArgs) && additionalArgs.length > 0) {
        args.push(...additionalArgs);
    }

    return exec('oc', args);
}

/**
 *
 * @param {string} cmd
 * @param {string[]} args
 * @param {import('@actions/exec').ExecOptions} execOptions
 * @returns {Promise<import('@actions/exec').ExecOutput>}
 */
async function command(cmd, args, execOptions = { silent: true }) {
    return exec('oc', [cmd, ...args], execOptions);
}

export {
    login,
    tagImage,
    startBuild,
    process,
    applyFromResourceDefinitionString,
    pauseRollouts,
    resumeRollouts,
    waitForRollout,
    getNames,
    get,
    logs,
    deleteResource,
    deleteResource as del,
    newProject,
    addRoleToGroup,
    command,
};
