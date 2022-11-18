import * as core from '@actions/core';
import * as oc from '../../common/util/oc.mjs';
import { getTestingNamespace } from '../../common/util/project-info.mjs';
import { CICD_PROJECT_NAME } from '../../common/constants.mjs';

async function run() {
    const testingNamespace = getTestingNamespace();

    const ocArgs = ['--namespace', testingNamespace];

    await core.group('Create testing namespace', async () => {
        let wait = true;
        try {
            await oc.del('project', testingNamespace, ['--wait']);
        } catch (e) {
            // The namespace didn't exist
            wait = false;
        }

        if (wait) {
            // TODO: Despite the `--wait` flag, the `oc delete` commands exits immediately after confirmation
            // from the kubernetes API. This means that if we try to recreate the namespace, we need to wait for
            // it to actually finish, or the `oc new-project` call will fail
        }

        await oc.newProject(testingNamespace);
        await oc.addRoleToGroup('edit', 'adm_aro_developers', ocArgs);
        await oc.addRoleToGroup('edit', 'adm_aro_testers', ocArgs);
        await oc.addRoleToGroup('edit', 'adm_aro_superdevelopers', ocArgs);
        await oc.addRoleToGroup(
            'system:image-puller',
            `system:serviceaccounts:${testingNamespace}`,
            ['--namespace', CICD_PROJECT_NAME]
        );
    });

    core.setOutput('testing-namespace', testingNamespace);
}

await run();
