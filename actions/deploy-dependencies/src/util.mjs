import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import core from '@actions/core';
import { mkdirP } from '@actions/io';
import { deployTemplatedResource } from '../../common/util/deployment.mjs';


export async function deployCommonResources(templatesPath, namespace, environment, ocArgs) {
    const envContent = `NAMESPACE=${namespace}\nENVIRONMENT=${environment}`;

    await mkdirP('/tmp/.commonresources');

    await writeFile('/tmp/.commonresources/env', envContent);

    const COMMON_RESOURCES = [
        'loyalty-configmap-template.yml',
        'loyalty-mysql-template.yml',
        'loyalty-oauth2-credentials-template.yml',
        'loyalty-postgresql-template.yml',
        'router-certs-template.yml',
        'keycloak-server-template.yml',
        'contentful-credentials-template.yml',
    ];

    await Promise.all(COMMON_RESOURCES.map(
        async resource => {
            try {
                deployTemplatedResource(path.join(templatesPath, resource), '/tmp/.commonresources/env', ocArgs);
            } catch (e) {
                core.error(`Failed to deploy ${resource}: ${e}`);
            }
        }
    ));
}

