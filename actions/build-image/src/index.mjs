import path from 'node:path';
import { readFile } from 'node:fs/promises';
import * as core from '@actions/core';
import { getExecOutput, exec } from '@actions/exec';
import { getServiceTag, getShortCommitHash, isMainBranch } from '../../common/util/project-info.mjs';
import * as oc from '../../common/util/oc.mjs';
import {
    BUILD_PROJECT_NAME,
    BUILD_TEMPLATE_PATH,
    DEPLOYMENT_PROJECT_NAME
} from '../../common/constants.mjs';

const ocArgs = [
    '--namespace', BUILD_PROJECT_NAME,
];

// eslint-disable-next-line no-unused-vars
async function getGitTag() {
    const gitTagOutput = await getExecOutput('git', [
        'describe', '--exact-match', '--tags'
    ], {
        ignoreReturnCode: true,
        silent: true
    });

    return gitTagOutput.exitCode === 0 ? gitTagOutput.stdout : 'latest';
}

async function buildImage(projectName, branchName, commitHash, serviceTag) {
    await deployBuildConfig(projectName, commitHash, serviceTag);

    await startBuild(projectName);

    if (isMainBranch(branchName)) {
        const imageName = `${BUILD_PROJECT_NAME}/${projectName}`;
        const releaseVersion = `v${serviceTag}`;

        const imageWithTag = `${imageName}:${serviceTag}`;
        await core.group(`Tag release ${serviceTag}`, async () => {
            await oc.tagImage(imageWithTag, [
                `${imageName}:${commitHash}`,
                `${DEPLOYMENT_PROJECT_NAME}/${projectName}:${serviceTag}`
            ], ocArgs);

            await tagRelease(releaseVersion, commitHash);
        });
    }
}

async function startBuild(projectName) {
    await core.group('Start build', () => oc.startBuild(projectName, true, ocArgs));
}

async function deployBuildConfig(projectName, commitHash, serviceTag) {
    await core.group('Deploy BuildConfig', async () => {
        await exec('sed', [
            '-i""', '-e', '/type: ConfigChange/d', BUILD_TEMPLATE_PATH
        ]);

        const buildConfig = await oc.process(BUILD_TEMPLATE_PATH, {
            NAME: projectName,
            SOURCE_REPOSITORY_URL: `git@github.com:icemobilelab/${projectName}.git`,
            SOURCE_REPOSITORY_REF: commitHash,
            SERVICE_TAG: serviceTag,
        }, ['-l', 'promotion-group=development']);

        await oc.applyFromResourceDefinitionString(buildConfig, ocArgs);
    });
}

async function tagRelease(releaseVersion, commitHash) {
    await exec('git', [
        'config', '--global', 'user.email', 'icemobile-ci@users.noreply.github.com'
    ]);

    await exec('git', [
        'config', '--global', 'user.name', 'IceMobile CI'
    ]);

    await exec('git', [
        'tag', '-d', releaseVersion
    ], {
        ignoreReturnCode: true
    });

    await exec('git', [
        'tag',
        '-a',
        releaseVersion, commitHash,
        '-m', `versioning ${releaseVersion}`
    ]);

    await exec('git', [
        'push', '-f', '--tags'
    ], {
        env: {
            HUSKY: '0'
        }
    });
}

async function run() {
    const projectName = process.env.GITHUB_REPOSITORY.split('/')[1];
    const branchName = process.env.GITHUB_REF_NAME || process.env.GITHUB_REF.slice('refs/heads/'.length);
    const commitHash = getShortCommitHash();
    const pkg = JSON.parse(
        await readFile(path.join(process.cwd(), 'package.json'))
    );
    const projectVersion = pkg.version.trim();

    const serviceTag = getServiceTag(branchName, projectVersion, commitHash);
    await buildImage(projectName, branchName, commitHash, serviceTag);
}

await run();
