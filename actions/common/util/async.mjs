import { setTimeout } from 'node:timers/promises';

async function awaitWithTimeout(promise, timeoutMs) {
    const ac = new AbortController();

    if (!timeoutMs || Number.isNaN(timeoutMs)) {
        throw new Error('timeout must be a number');
    }

    const [result] = await Promise.all([
        (async () => {
            try {
                return await promise;
            } finally {
                ac.abort();
            }
        })(),
        (async () => {
            try {
                await setTimeout(timeoutMs, null, {
                    signal: ac.signal
                });

                throw Error('Timed out');
            } catch (e) {
                if (!ac.signal.aborted) {
                    throw e;
                }
            }
        })(),
    ]);

    return result;
}

async function sleep(durationMs) {
    await setTimeout(durationMs);
}

export {
    awaitWithTimeout,
    sleep,
};
