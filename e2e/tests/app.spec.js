import { expect, test } from '@playwright/test'

async function readCatalog(page) {
  const response = await page.request.get('/api/productos')
  expect(response.status()).toBe(200)
  return response.json()
}
function byId(catalog, id) {
  const item = catalog.find((product) => product.id === id)
  expect(item).toBeDefined()
  return item
}

test('frontend se conecta al backend Go + PostgreSQL', async ({ page }) => {
  const pageErrors = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await page.goto('/')
  await expect(page.getByRole('status', { name: 'Estado de API: API conectada' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Agregar Arroz Faisán 1lb al ticket' })).toBeVisible()
  expect((await readCatalog(page)).length).toBeGreaterThan(10)
  expect(pageErrors).toEqual([])
})

test('cobra usando Go, descuenta stock en PostgreSQL y persiste tras recargar', async ({ page }, testInfo) => {
  const pageErrors = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  const initial = await readCatalog(page)
  const beforeArroz = byId(initial, 'arroz-faisan-1lb').stockActual
  const beforeFrijol = byId(initial, 'frijol-rojo-1lb').stockActual
  expect(beforeArroz).toBeGreaterThan(0)
  expect(beforeFrijol).toBeGreaterThan(0)

  await page.goto('/')
  await page.getByRole('button', { name: 'Agregar Arroz Faisán 1lb al ticket' }).click()
  await page.getByRole('button', { name: 'Agregar Frijol Rojo 1lb al ticket' }).click()
  await page.getByRole('spinbutton', { name: 'Efectivo recibido' }).fill('50')
  await expect(page.getByText('Efectivo insuficiente')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cobrar y Descontar Stock' })).toBeDisabled()
  await page.getByRole('spinbutton', { name: 'Efectivo recibido' }).fill('100')

  if (testInfo.project.name === 'mobile-chromium') {
    await page.getByRole('button', { name: 'Cobrar', exact: true }).click()
  } else {
    await page.getByRole('button', { name: 'Cobrar y Descontar Stock' }).click()
  }
  await expect(page.getByText('El ticket está vacío')).toBeVisible()
  const after = await readCatalog(page)
  expect(byId(after, 'arroz-faisan-1lb').stockActual).toBe(beforeArroz - 1)
  expect(byId(after, 'frijol-rojo-1lb').stockActual).toBe(beforeFrijol - 1)
  await page.reload()
  await expect(page.getByRole('button', { name: 'Agregar Arroz Faisán 1lb al ticket' })).toBeVisible()
  await expect(page.getByText(`Stock ${beforeArroz - 1}`, { exact: true })).toBeVisible()
  expect(pageErrors).toEqual([])
})

test('API impide la venta si no hay stock y mantiene las existencias', async ({ page }) => {
  const before = byId(await readCatalog(page), 'agua-cristal-600ml')
  expect(before.stockActual).toBe(0)
  const response = await page.request.post('/api/ventas', {
    data: {
      requestId: crypto.randomUUID(),
      cashReceived: 20,
      items: [{ productId: 'agua-cristal-600ml', quantity: 1 }],
    },
  })
  expect(response.status()).toBe(409)
  expect(byId(await readCatalog(page), 'agua-cristal-600ml').stockActual).toBe(0)
})
