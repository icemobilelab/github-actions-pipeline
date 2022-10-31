function getServiceTag(branch, projectVersion) {
    if (branch === 'develop' || branch === 'master') {
        return projectVersion;
    } else {
        return branch.toLowerCase().replace(/[ \.\/]/g, '_');
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
    return process.env.GITHUB_REF_NAME || process.env.GITHUB_REF.slice('refs/heads/'.length);
}

function getShortCommitHash() {
    return process.env.GITHUB_SHA.slice(0, 10);
}

/**
 * Outputs the namespace used for integration tests
 *
 * @param {string} [projectName] The name of the project. If null, calculated from environment
 * @returns {string} the testing namespace
 */
function getTestingNamespace(projectName) {
    const _projectName = projectName || getCurrentProjectName();
    const shortSha = getShortCommitHash();
    return `test-${_projectName}-${shortSha}-p4vl0s7r1n9`;
}

export {
    getServiceTag,
    getCurrentProjectName,
    getCurrentBranchName,
    getTestingNamespace,
    getShortCommitHash,
};

