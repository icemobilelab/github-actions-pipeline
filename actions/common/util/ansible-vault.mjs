import { exec } from '@actions/exec';

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
