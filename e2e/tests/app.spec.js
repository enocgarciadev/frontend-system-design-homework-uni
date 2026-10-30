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

async function openProducts(page, projectName) {
  if (projectName === 'mobile-chromium') {
    await page.getByRole('button', { name: 'Toggle Sidebar' }).first().click()
  }
  await page.getByRole('button', { name: 'Productos', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Gestión de productos' })).toBeVisible()
}

test('gestiona productos en React y persiste en PostgreSQL', async ({ page }, testInfo) => {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  const id = `e2e-product-${Date.now()}-${testInfo.project.name === 'mobile-chromium' ? 'm' : 'd'}`
  const name = `Producto demo ${id}`

  await page.goto('/')
  await openProducts(page, testInfo.project.name)
  await page.getByRole('button', { name: 'Nuevo producto' }).click()
  await page.getByLabel('Código interno').fill(id)
  await page.getByLabel('Nombre del producto').fill(name)
  await page.getByLabel('Precio de venta (C$)').fill('24.50')
  await page.getByLabel('Stock inicial').fill('9')
  await page.getByLabel('Stock mínimo').fill('2')
  await page.getByRole('button', { name: 'Guardar producto' }).click()
  await expect(page.getByText('Producto creado correctamente.')).toBeVisible()

  await page.getByRole('textbox', { name: 'Buscar en productos' }).fill(id)
  await expect(page.getByRole('heading', { name })).toBeVisible()
  await page.reload()
  await openProducts(page, testInfo.project.name)
  await page.getByRole('textbox', { name: 'Buscar en productos' }).fill(id)
  await page.getByRole('button', { name: `Editar ${name}` }).click()
  await page.getByLabel('Nombre del producto').fill(`${name} editado`)
  await page.getByLabel('Precio de venta (C$)').fill('30.25')
  await expect(page.getByLabel('Stock actual (solo lectura)')).toBeDisabled()
  await page.getByRole('button', { name: 'Guardar producto' }).click()
  await expect(page.getByText('Producto actualizado correctamente.')).toBeVisible()
  await expect(page.getByRole('heading', { name: `${name} editado` })).toBeVisible()

  await page.getByRole('button', { name: `Desactivar ${name} editado` }).click()
  await page.getByRole('button', { name: `Confirmar baja de ${name} editado` }).click()
  await expect(page.getByText('Producto desactivado. Las ventas anteriores se conservan.')).toBeVisible()
  await expect(page.getByRole('heading', { name: `${name} editado` })).toHaveCount(0)
  await page.reload()
  await openProducts(page, testInfo.project.name)
  await page.getByRole('textbox', { name: 'Buscar en productos' }).fill(id)
  await expect(page.getByRole('heading', { name: `${name} editado` })).toHaveCount(0)
  expect(errors).toEqual([])
})
