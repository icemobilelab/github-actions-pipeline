import * as core from '@actions/core';
import * as oc from '../../common/util/oc.mjs';

async function run() {
    const server = core.getInput('openshift-server-api-url');
    const token = core.getInput('openshift-auth-token');

    await core.group('Log into OpenShift cluster', async () => {
        for (let i = 0; i < 2; i++) {
            try {
                await oc.login(server, token);
            } catch (e) {
                core.warning(`Failed to log into cluster: ${e.stderr}`);
                if (i === 0) {
                    core.info('Retrying once');
                    continue;
                }
                throw e;
            }
            break;
        }
    });
}

await run();
