'use strict';

const path = require('path');
const core = require('@actions/core');
const { writeFile } = require('fs/promises');
const SwaggerParser = require("@apidevtools/swagger-parser");

async function extractPublicSpecificationFromInternal(internalSpecification, basePath = '') {
    const parser = new SwaggerParser();

    const api = await parser.parse(internalSpecification);

    for (let path in api.paths) {
        if (basePath) {
            const sanitizedBasePath = basePath.replace(/\/+$/, '');
            const oldPath = path;
            path = `${sanitizedBasePath}${path}`;
            api.paths[path] = api.paths[oldPath];
            delete api.paths[oldPath];
        }

        let countPublicOperations = 0;
        for (const operation in api.paths[path]) {
            if (api.paths[path][operation]['x-public-facing'] === true) {
                countPublicOperations++;
            } else {
                delete api.paths[path][operation];
            }
        }

        if (countPublicOperations === 0) {
            delete api.paths[path];
        }
    }

    return api;
};

async function parsePublicSpecification(publicSpecification) {
    const parser = new SwaggerParser();
    const api = await parser.parse(publicSpecification);
    delete api.paths;
    return api;
};

async function mergeSwagger(internalSpecification, publicSpecification, apiBasePath) {
    core.startGroup('Merge OpenAPI/Swagger Spec');
    const internalApi = await extractPublicSpecificationFromInternal(internalSpecification, apiBasePath);
    const publicApi = await parsePublicSpecification(publicSpecification);

    const mergedApi = { ...internalApi, ...publicApi };
    if (!mergedApi.components.securitySchemes) {
        mergedApi.components.securitySchemes = {};
    }

    if (!mergedApi.security) {
        mergedApi.security = [];
    }

    mergedApi.components.securitySchemes.threescale_api_key = {
        type: "apiKey",
        in: "header",
        name: "X-API-Key"
    };

    mergedApi.security.push({
        threescale_api_key: []
    })


    await writeFile(path.join(process.cwd(), 'merged-swagger.json'), JSON.stringify(mergedApi));
    core.endGroup();
}

module.exports = {
    mergeSwagger,
}
