const { createClient } = require('redis')

const client = createClient({ url: 'redis://127.0.0.1:6379' })
let connected = false

client.on('error', (err) => {
  console.error('Redis Client Error', err)
})

client.on('connect', () => {
  connected = true
})

client.on('end', () => {
  connected = false
})


async function ensureConnected() {
  if (!connected) {
    await client.connect()
    connected = true
  }
}

async function connect() {
  await ensureConnected()
  return true
}

function getConnectionStatus() {
  // prefer client.isOpen (boolean) when available
  try {
    return !!client.isOpen
  } catch (e) {
    return connected
  }
}

module.exports = {
  client,
  ensureConnected,
  connect,
  getConnectionStatus,
}
