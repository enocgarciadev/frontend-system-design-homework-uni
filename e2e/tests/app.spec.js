import { expect, test } from '@playwright/test'

test('API responde y el frontend indica que está conectada', async ({ page }) => {
  const pageErrors = []
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await page.goto('/')
  await expect(page.getByRole('status', { name: 'Estado de API: API conectada' })).toBeVisible()

  const response = await page.request.get('/api/health')
  expect(response.status()).toBe(200)
  expect(await response.json()).toEqual({ status: 'ok', service: 'pulpestock-api' })
  expect(pageErrors).toEqual([])
})

test('el POS conserva el cobro y validación del efectivo', async ({ page, isMobile }) => {
  const pageErrors = []
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await page.goto('/')
  await page.getByRole('button', { name: 'Agregar Arroz Faisán 1lb al ticket' }).click()
  await page.getByRole('button', { name: 'Agregar Frijol Rojo 1lb al ticket' }).click()

  await page.getByRole('spinbutton', { name: 'Efectivo recibido' }).fill('50')
  await expect(page.getByText('Efectivo insuficiente')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cobrar y Descontar Stock' })).toBeDisabled()

  await page.getByRole('spinbutton', { name: 'Efectivo recibido' }).fill('100')
  if (isMobile) {
    await page.getByRole('button', { name: 'Cobrar', exact: true }).click()
  } else {
    await page.getByRole('button', { name: 'Cobrar y Descontar Stock' }).click()
  }

  await expect(page.getByText('El ticket está vacío')).toBeVisible()
  await expect(page.getByText('Stock 23')).toBeVisible()
  expect(pageErrors).toEqual([])
})
