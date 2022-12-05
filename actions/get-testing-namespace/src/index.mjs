import * as core from '@actions/core';
import { getTestingNamespace } from '../../common/util/project-info.mjs';

const OUTPUT_KEY = 'testing-namespace';
async function run() {
    const testingNamespace = await getTestingNamespace();
    core.setOutput(OUTPUT_KEY, testingNamespace);
}

await run();
