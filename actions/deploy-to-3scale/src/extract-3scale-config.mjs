import { readFile } from 'node:fs/promises';
import * as core from '@actions/core';
import { clusters } from '../../common/config.mjs';

export async function extract3scaleConfig(cluster) {
    return await core.group('Extract 3scale config', async () => {
        const pkg = JSON.parse(await readFile('package.json'));
        const threeScale = pkg.threeScale;
        const clusterConfig = clusters[cluster];
        if (
            threeScale && cluster === 'tst'
            || (threeScale.clusters || []).some(c => {
                const id = c.name.toUpperCase();
                return id === clusterConfig.clusterId || id === clusterConfig.oldClusterId;
            })
        ) {

            const systemName = threeScale.systemName || '';
            const publicBasePath = threeScale.publicBasePath || '';
            const threescaleInternalSwaggerSuffix = threeScale.threescaleInternalSwaggerSuffix || '';
            const threescaleDestinationCluster = clusterConfig.threeScaleConsole || '';

            return {
                systemName,
                publicBasePath,
                threescaleInternalSwaggerSuffix,
                threescaleDestinationCluster,
            };
        }
    });
}
