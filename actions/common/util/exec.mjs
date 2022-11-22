import * as core from '@actions/core';
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
async function exec(command, args, options) {
    const _opts = Object.assign({}, options, FORCED_OPTIONS);
    const execOutput = await getExecOutput(command, args, _opts);

    core.debug(`Ran ${command} ${args.join(' ')}`);
    core.debug(`Exit code: ${execOutput.exitCode}`);
    if (execOutput.exitCode === 0) {
        return execOutput;
    }

    core.debug(`Stderr: ${execOutput.stderr}`);

    throw Object.assign(
        new Error(`Command '${command}' exited with code ${execOutput.exitCode}`),
        execOutput
    );
};

export {
    exec,
};
