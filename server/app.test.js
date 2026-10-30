import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { once } from 'node:events'
import { createAppServer } from './app.js'

const server = createAppServer()
let baseUrl

before(async () => {
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
})

test('GET /api/health devuelve respuesta JSON utilizable', async () => {
  const response = await fetch(`${baseUrl}/api/health`)
  assert.equal(response.status, 200)
  assert.match(response.headers.get('content-type'), /application\/json/)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.deepEqual(await response.json(), { status: 'ok', service: 'pulpestock-api' })
})

test('métodos no permitidos se rechazan', async () => {
  const response = await fetch(`${baseUrl}/api/health`, { method: 'POST' })
  assert.equal(response.status, 405)
  assert.equal(response.headers.get('allow'), 'GET')
  assert.deepEqual(await response.json(), { error: 'Method Not Allowed' })
})

test('rutas desconocidas devuelven JSON 404', async () => {
  const response = await fetch(`${baseUrl}/api/no-existe`)
  assert.equal(response.status, 404)
  assert.deepEqual(await response.json(), { error: 'Not Found' })
})
