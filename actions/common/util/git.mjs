import path from 'node:path';
import { exec, getExecOutput } from '@actions/exec';

/**
 * Configures git globally for proper GitHub authentication
 *
 * @param {string} githubPAT The GitHub personal access token (PAT) to use for authentication
 */
async function configureGithubAuthentication(githubPAT) {
    await exec('bash', [
        '-c', `
        git config --global --add url."https://${githubPAT}:x-oauth-basic@github.com/".insteadOf "https://github.com/"
        git config --global --add url."https://${githubPAT}:x-oauth-basic@github.com/".insteadOf "git@github.com:"
        `
    ]);
}

async function cloneGithubDependency(dependencyName, branch, baseDirectory) {
    const args = [
        'clone',
        `https://github.com/icemobilelab/${dependencyName}.git`,
        dependencyName
    ];

    await exec('git', args, {
        cwd: baseDirectory
    });

    if (branch) {
        await exec('git', [
            'checkout', branch
        ], {
            cwd: path.join(baseDirectory, dependencyName)
        });
    }
}

const DEFAULT_BRANCH_REGEXP = /(main|master|develop)/;
async function getDefaultGitBranch(projectName) {
    const { stdout } = await getExecOutput('git', [
        'ls-remote',
        '--symref',
        `git@github.com:icemobilelab/${projectName}.git`,
        '--short',
        'HEAD'
    ], {
        silent: true
    });

    const defaultBranch = stdout.match(DEFAULT_BRANCH_REGEXP)[1];

    return defaultBranch;
};

export {
    configureGithubAuthentication,
    cloneGithubDependency,
    getDefaultGitBranch,
};
