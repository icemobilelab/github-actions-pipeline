import { exec } from './exec.mjs';

function getServiceTag(branch, projectVersion, commitHash) {
    if (branch === 'develop' || branch === 'master' || branch === 'main') {
        return projectVersion;
    } else {
        const sanitizedBranchName = branch.toLowerCase().replace(/[ \.\/]/g, '_');
        return `${sanitizedBranchName}-${commitHash}`;
    }
}

/**
 * Outputs the name of the current project, based on the git repository name
 *
 * @returns {string} The name of the current project
 */
function getCurrentProjectName() {
    return process.env.GITHUB_REPOSITORY.split('/')[1];
}

/**
 * Outputs the name of the current branch, based on the github actions runner environment
 *
 * @returns {string} The name of the current branch
 */
function getCurrentBranchName() {
    return process.env.GITHUB_HEAD_REF ||
        process.env.GITHUB_REF_NAME ||
        process.env.GITHUB_REF.slice('refs/heads/'.length);
}

async function _getHEADHash(short = false) {
    const { stdout: sha } = exec('git',[
        'rev-parse',
        ...(short ? ['--short'] : []),
        'HEAD',
    ]);

    return sha.trim();
}

async function getCurrentCommitShortHash() {
    return _getHEADHash(true);
}

async function getCurrentCommitHash() {
    return _getHEADHash(false);
}

/**
 * Outputs the namespace used for integration tests
 *
 * @param {string} [projectName] The name of the project. If null, calculated from environment
 * @returns {string} the testing namespace
 */
async function getTestingNamespace(projectName) {
    const _projectName = projectName || getCurrentProjectName();
    const shortSha = await getCurrentCommitShortHash();
    return `test-${_projectName}-${shortSha}-p4vl0s7r1n9`;
}

function isMainBranch(branchName) {
    return branchName === 'master' || branchName === 'develop' || branchName === 'main';
}

export {
    getServiceTag,
    getCurrentProjectName,
    getCurrentBranchName,
    getCurrentCommitHash,
    getTestingNamespace,
    getCurrentCommitShortHash,
    isMainBranch,
};
