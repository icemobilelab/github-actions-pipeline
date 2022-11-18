import { dirname } from 'node:path';

const BUILD_TEMPLATE_PATH = 'openshift/templates/build_template.yml';
const BUILD_PROJECT_NAME = 'build';
const DEPLOYMENT_PROJECT_NAME = 'loyalty-tst';
const WORKSPACE_DIRECTORY = dirname(process.env.GITHUB_WORKSPACE);
const OPENSHIFT_TEMPLATES_PATH = 'openshift/templates';
const TEMPLATE_PARAMETERS_DIRECTORY_NAME = 'parameters';

export {
    BUILD_TEMPLATE_PATH,
    BUILD_PROJECT_NAME,
    DEPLOYMENT_PROJECT_NAME,
    WORKSPACE_DIRECTORY,
    OPENSHIFT_TEMPLATES_PATH,
    TEMPLATE_PARAMETERS_DIRECTORY_NAME,
};
