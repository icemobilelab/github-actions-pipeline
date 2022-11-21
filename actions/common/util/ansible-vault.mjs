import { exec } from '../../common/util/exec.mjs';

async function decryptAnsibleVault(vaultPasswordFile, vaultFilePath) {
    await exec('ansible-vault', [
        'decrypt',
        '--vault-password-file',
        vaultPasswordFile,
        vaultFilePath,
    ]);
}

export {
    decryptAnsibleVault,
};
