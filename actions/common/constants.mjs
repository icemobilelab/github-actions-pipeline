import { dirname } from 'node:path';

const BUILD_PROJECT_NAME = 'build';
const CICD_PROJECT_NAME = 'cicd';
const BUILD_TEMPLATE_PATH = 'openshift/templates/build_template.yml';
const DEPLOYMENT_PROJECT_NAME = 'loyalty-tst';
const WORKSPACE_DIRECTORY = dirname(process.env.GITHUB_WORKSPACE);
const OPENSHIFT_TEMPLATES_PATH = 'openshift/templates';
const TEMPLATE_PARAMETERS_DIRECTORY_NAME = 'parameters';

export {
    BUILD_TEMPLATE_PATH,
    CICD_PROJECT_NAME,
    BUILD_PROJECT_NAME,
    DEPLOYMENT_PROJECT_NAME,
    WORKSPACE_DIRECTORY,
    OPENSHIFT_TEMPLATES_PATH,
    TEMPLATE_PARAMETERS_DIRECTORY_NAME,
};
