/**
 * @typedef ClusterConfig
 * @property {string} name
 * @property {string} env
 * @property {string} defaultNamespace
 * @property {string} clusterId
 * @property {string} oldClusterId
 * @property {string} hostname
 * @property {string} threeScaleConsole,
 */

/**
 * @type {Readonly<Record<string, ClusterConfig>>}
 */
const clusters = Object.freeze({
    tst: {
        name: 'TST',
        env: 'tst',
        defaultNamespace: 'loyalty-tst',
        clusterId: 'TST',
        oldClusterId: 'TST',
        hostname: 'r3vzjvjk.westeurope.aroapp.io',
        threeScaleConsole: 'icemobile-tst',
    },
    'acc-canadacentral': {
        name: 'ACC Canada Central',
        env: 'acc',
        defaultNamespace: 'loyalty-acc',
        clusterId: 'ACC_CANADACENTRAL',
        oldClusterId: 'ARO_ACC_CANADACENTRAL',
        hostname: 'acc.canadacentral.bright-shopper.com',
        threeScaleConsole: 'canadacentral-oxxo-acc',
    },
    'acc-westeurope': {
        name: 'ACC West Europe',
        env: 'acc',
        defaultNamespace: 'loyalty-acc',
        clusterId: 'ACC_WESTEUROPE',
        oldClusterId: 'ARO_ACC_WESTEUROPE',
        hostname: 'acc.westeurope.bright-shopper.com',
        threeScaleConsole: 'westeurope-acc',
    },
    'prd-canadacentral': {
        name: 'PRD Canada Central',
        env: 'prd',
        defaultNamespace: 'loyalty-prd',
        clusterId: 'PRD_CANADACENTRAL',
        oldClusterId: 'PRD_CANADA_CENTRAL',
        hostname: 'prd.canadacentral.bright-shopper.com',
        threeScaleConsole: 'canadacentral-oxxo-prd',
    },
    'prd-canadacentral2': {
        name: 'PRD Canada Central 2',
        env: 'prd',
        defaultNamespace: 'loyalty-prd',
        clusterId: 'PRD_CANADACENTRAL2',
        oldClusterId: 'PRD2_CANADA_CENTRAL',
        hostname: 'prd2.canadacentral.bright-shopper.com',
        threeScaleConsole: 'canada-central-prd2',
    },
    'prd-westeurope': {
        name: 'PRD West Europe',
        env: 'prd',
        defaultNamespace: 'loyalty-prd',
        clusterId: 'PRD_WESTEUROPE',
        oldClusterId: 'ARO_PRD_WESTEUROPE',
        hostname: 'prd.westeurope.bright-shopper.com',
        threeScaleConsole: 'westeurope-prd',
    },
});

export { clusters };
