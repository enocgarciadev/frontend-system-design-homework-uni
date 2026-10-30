import { createAppServer } from './app.js'

const port = Number(process.env.PORT ?? 3001)
const host = process.env.HOST || '127.0.0.1'

if (!Number.isInteger(port) || port < 0 || port > 65535) {
  throw new Error('PORT debe ser un entero entre 0 y 65535')
}

const server = createAppServer()
server.listen(port, host, () => {
  const address = server.address()
  console.log(`PulpeStock API lista en http://${host}:${address.port}`)
})
