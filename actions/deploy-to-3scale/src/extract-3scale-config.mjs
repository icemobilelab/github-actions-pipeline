import { readFile } from 'node:fs/promises';
import * as core from '@actions/core';

const clusterMap = {
    TST: 'icemobile-tst',
    ARO_ACC_CANADACENTRAL: 'canadacentral-oxxo-acc',
    ARO_PRD_CANADACENTRAL: 'canadacentral-oxxo-prd',
    ARO_PRD_CANADACENTRAL2: 'canada-central-prd2',
    ARO_ACC_WESTEUROPE: 'westeurope-acc',
    ARO_PRD_WESTEUROPE: 'westeurope-prd',
};

export async function extract3scaleConfig(cluster) {
    return await core.group('Extract 3scale config', async () => {
        const pkg = JSON.parse(await readFile('package.json'));
        let deploy = false;
        const threeScale = pkg.threeScale;

        if (threeScale) {
            if (cluster === 'TST' || (threeScale.clusters || []).some(c => c.name.toUpperCase() === cluster)) {
                deploy = true;
            }
        }

        const systemName = threeScale?.systemName || '';
        const publicBasePath = threeScale?.publicBasePath || '';
        const threescaleInternalSwaggerSuffix = threeScale?.threescaleInternalSwaggerSuffix || '';
        const threescaleDestinationCluster = clusterMap[cluster] || '';

        core.info(`threescale_deploy = ${deploy}`);
        core.info(`threescale_system_name = ${systemName}`);
        core.info(`threescale_public_base_path = ${publicBasePath}`);
        core.info(`threescale_swagger_suffix = ${threescaleInternalSwaggerSuffix}`);
        core.info(`threescale_destination_cluster = ${threescaleDestinationCluster}`);
        return {
            deploy,
            systemName,
            publicBasePath,
            threescaleInternalSwaggerSuffix,
            threescaleDestinationCluster,
        };
    });
}
