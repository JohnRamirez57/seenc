import { createClient } from 'redis';
import { createHash } from 'node:crypto';
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';

config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)), quiet: true });

export const client = createClient({
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
    disableOfflineQueue: true,
    socket: { connectTimeout: 750, reconnectStrategy: false },
});
let connection: Promise<boolean> | undefined;
let retryAfter = 0;
export let isConnected = false;
client.on('error', () => { isConnected = false; });
client.on('end', () => { isConnected = false; });
client.on('ready', () => { isConnected = true; });

export async function ensureConnected(): Promise<boolean> {
    if (process.env.REDIS_ENABLED === 'false') return false;
    if (client.isReady) return true;
    if (connection) return connection;
    if (Date.now() < retryAfter) return false;
    connection = (async () => {
        try {
            await client.connect();
            return true;
        } catch {
            retryAfter = Date.now() + 30_000;
            return false;
        } finally {
            connection = undefined;
        }
    })();
    return connection;
}

export async function getRedisValue(key: string): Promise<string | null> {
    if (!await ensureConnected()) return null;
    try { return await client.withCommandOptions({ timeout: 750 }).get(key); }
    catch { return null; }
}

export async function setRedisValue(key: string, value: string, ttlSeconds = 3600) {
    if (!await ensureConnected()) return;
    try { await client.withCommandOptions({ timeout: 750 }).set(key, value, { EX: ttlSeconds }); }
    catch { /* Cache failures must not fail the original request. */ }
}

export async function deleteRedisValue(key: string) {
    if (!await ensureConnected()) return;
    try { await client.withCommandOptions({ timeout: 750 }).del(key); }
    catch { /* Expiration will remove the entry if deletion fails. */ }
}

export function cacheKey(namespace: string, input: unknown) {
    const hash = createHash('sha256').update(JSON.stringify(input)).digest('hex');
    return `seenc:v1:${namespace}:${hash}`;
}

const pending = new Map<string, Promise<unknown>>();
export async function remember<T>(key: string, ttlSeconds: number, load: () => Promise<T>): Promise<T> {
    const existing = pending.get(key);
    if (existing) return structuredClone(await existing) as T;
    const request = (async () => {
        const cached = await getRedisValue(key);
        if (cached !== null) {
            try { return JSON.parse(cached) as T; }
            catch { await deleteRedisValue(key); }
        }
        const value = await load();
        await setRedisValue(key, JSON.stringify(value), ttlSeconds);
        return value;
    })();
    pending.set(key, request);
    try { return structuredClone(await request); }
    finally { pending.delete(key); }
}
