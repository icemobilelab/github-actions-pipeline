import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, writeFile } from 'node:fs/promises';
import * as core from '@actions/core';
import {
    getCurrentBranchName,
    getCurrentProjectName,
    getServiceTag,
    getShortCommitHash
} from '../../common/util/project-info.mjs';
import * as oc from '../../common/util/oc.mjs';
import { sleep } from '../../common/util/async.js';

const ACTION_TEMPLATES_PATH = fileURLToPath(new URL('../templates', import.meta.url));

async function _getJobPodCount(jobName, status, ocArgs) {
    const args = [
        'jobs', jobName,
        ...ocArgs,
        '-o', `jsonpath={.status.${status}}`
    ];
    const { stdout } = await oc.command('get', args);

    const podCount = parseInt(stdout.trim(), 10);
    return Number.isNaN(podCount) ? 0 : podCount;
}

async function run() {
    const projectName = getCurrentProjectName();
    const namespace = core.getInput('namespace');
    const branch = getCurrentBranchName();
    const jobName = `integration-tests-${projectName}`;
    const ocArgs = ['--namespace', namespace];
    const pkg = JSON.parse(
        await readFile('package.json')
    );
    const projectVersion = pkg.version.trim();
    const serviceTag = getServiceTag(branch, projectVersion, getShortCommitHash());

    const job = await oc.process(path.join(ACTION_TEMPLATES_PATH, 'integration-test-job.yaml'), {
        TESTING_NAMESPACE: namespace,
        PROJECT_NAME: projectName,
        SERVICE_TAG: serviceTag
    });

    await oc.applyFromResourceDefinitionString(job, ocArgs);

    core.info('Waiting for integration test job to start...');
    for (; ;) {
        const activePods = await _getJobPodCount(jobName, 'active', ocArgs);
        if (activePods === 1) {
            break;
        }

        await sleep(1000);
    }

    for (; ;) {
        try {
            const logs = await oc.logs(`job/${jobName}`, true, true, ocArgs);
            await writeFile('integration-tests-logs.txt', logs);
            break;
        } catch (e) {
            await sleep(1000);
            const activePods = await _getJobPodCount(jobName, 'active', ocArgs);
            if (activePods !== 1) {
                break;
            }
        }

    }

    core.info('Waiting for integration test job to finish...');
    for (; ;) {
        const activePods = await _getJobPodCount(jobName, 'active', ocArgs);
        if (activePods !== 1) {
            break;
        }

        await sleep(1000);
    }

    const succeededPods = await _getJobPodCount(jobName, 'succeeded', ocArgs);
    if (succeededPods !== 1) {
        throw new Error('Integration tests failed');
    }
}

await run();
