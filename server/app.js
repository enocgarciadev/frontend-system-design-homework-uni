import { createServer } from 'node:http'

function sendJson(response, status, payload, extraHeaders = {}) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extraHeaders,
  })
  response.end(JSON.stringify(payload))
}

export function createAppServer() {
  return createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost')

    if (url.pathname === '/api/health') {
      if (request.method !== 'GET') {
        sendJson(response, 405, { error: 'Method Not Allowed' }, { Allow: 'GET' })
        return
      }

      sendJson(response, 200, { status: 'ok', service: 'pulpestock-api' })
      return
    }

    sendJson(response, 404, { error: 'Not Found' })
  })
}
