import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import * as core from '@actions/core';
import * as oc from '../../common/util/oc.mjs';

const LOGS_OUTPUT_DIR = 'pod-logs';

async function run() {
    const namespace = core.getInput('namespace');
    const ocArgs = [
        '--namespace', namespace
    ];

    const [pods] = await Promise.all([
        oc.get('pods', null, ocArgs),
        mkdir(LOGS_OUTPUT_DIR, {
            recursive: true
        }),
    ]);

    core.debug(`Found pods ${pods}`);

    await Promise.all(
        pods.map(async pod => {
            const logs = await oc.logs(pod, false, false, ocArgs);
            const fileName = `${pod.replace('pod/', '')}.txt`;
            const fullFilePath = path.join(LOGS_OUTPUT_DIR, fileName);
            await writeFile(fullFilePath, logs);
        })
    );

    core.setOutput('output-directory', LOGS_OUTPUT_DIR);
}

await run();
