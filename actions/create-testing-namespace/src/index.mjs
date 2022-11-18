import * as core from '@actions/core';
import * as oc from '../../common/util/oc.mjs';
import { getTestingNamespace } from '../../common/util/project-info.mjs';

async function run() {
    /**
     * _projectName="$(echo -n "$GITHUB_REPOSITORY" | awk -F/ '{ print $2 }')"
  #       ns="test-${_projectName}-${GITHUB_SHA:0:8}-p4vl0s7r1n9"
  #       echo "ns=${ns}" >> $GITHUB_OUTPUT

  #       oc delete project "${ns}" --wait || true

  #       oc new-project "${ns}"
  #       oc adm policy add-role-to-group edit adm_aro_developers -n "${ns}"
  #       oc adm policy add-role-to-group edit adm_aro_testers -n "${ns}"
  #       oc adm policy add-role-to-group edit adm_aro_superdevelopers -n "${ns}"
  #       oc adm policy add-role-to-group system:image-puller "system:serviceaccounts:${ns}" -n cicd
     */
    const testingNamespace = getTestingNamespace();

    core.group('Create testing namespace', async () => {
        const deleteCode = await oc.del('project', testingNamespace, ['--wait']);

        if (deleteCode !== 0) {

        }
    });
}

await run();
