import core from '@actions/core';
import { getExecOutput } from '@actions/exec';

/**
 * @type {import('@actions/exec').ExecOptions}
 */
const FORCED_OPTIONS = {
    ignoreReturnCode: true,
};

/**
 * @type {import('@actions/exec').getExecOutput}
 */
async function _exec(command, args, options) {
    const _opts = Object.assign({}, options, FORCED_OPTIONS);
    const execOutput = await getExecOutput(command, args, _opts);

    if (execOutput.exitCode === 0) {
        return execOutput;
    }

    return Object.assign(
        new Error(`Command '${command}' exited with code ${execOutput.exitCode}`),
        execOutput
    );
};


/**
 * @param {string} server The OpenShift server API URL
 * @param {string} token The OpenShift auth token
 * @returns {Promise.<import('@actions/exec').ExecOutput>}
 */
async function login(server, token) {
    return _exec('oc', [
        'login',
        '--server', server,
        '--token', token,
    ]);
}

async function tagImage(image, tag, additionalArgs = []) {
    const args = [
        'tag',
        image,
        tag,
    ];

    if (Array.isArray(additionalArgs) && additionalArgs.length > 0) {
        args.push(...additionalArgs);
    }

    return _exec('oc', args);
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

    return _exec('oc', args);
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

    const { stdout: resourceDefinition } = await _exec('oc', args, {
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

    return _exec('oc', args, {
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

    return _exec('oc', args);
}

/**
 * Fetches a list of resource names from the cluster
 *
 * @param {string} resourceType The resource type to fetch
 * @param {string} [resourceName] The resource name to fetch
 * @param {string[]} additionalArgs Additional arguments to the `oc get` command
 * @returns {Promise<string[]>} A list of the names of found resources
 */
async function get(resourceType, resourceName, additionalArgs = []) {
    const args = [
        'get',
        resourceType,
        ...(resourceName ? [resourceName] : []),
        '-o', 'name'
    ];

    if (Array.isArray(additionalArgs) && additionalArgs.length > 0) {
        args.push(...additionalArgs);
    }

    const { stdout } = await _exec('oc', args, {
        silent: true
    });

    return stdout.trim().split('\n');
}

async function logs(resource, follow = false, additionalArgs = []) {
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

    const { stdout } = await _exec('oc', args, {
        silent: true
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

    return _exec('oc', args);
}

async function newProject(projectName, additionalArgs = []) {
    const args = [
        'new-project',
        projectName,
    ];

    if (Array.isArray(additionalArgs) && additionalArgs.length > 0) {
        args.push(...additionalArgs);
    }

    return _exec('oc', args);
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

    return _exec('oc', args);
}

export {
    login,
    tagImage,
    startBuild,
    process,
    applyFromResourceDefinitionString,
    waitForRollout,
    get,
    logs,
    deleteResource,
    deleteResource as del,
    newProject,
    addRoleToGroup,
};
