import { createClient } from 'redis'

export const client = createClient({ url: 'redis://127.0.0.1:6379' })

client.on('error', (error) => {
	console.error('Redis Client Error', error)
})

export let isConnected = false

export async function ensureConnected() {
	if (!isConnected) {
		await client.connect()
		isConnected = true
	}
}

export async function getRedisValue(key: string) {
	await ensureConnected()
	return client.get(key)
}

export async function setRedisValue(key: string, value: string) {
	await ensureConnected()
	return client.set(key, value)
}

export async function deleteRedisValue(key: string) {
	await ensureConnected()
	return client.del(key)
}