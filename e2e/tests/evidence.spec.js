import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const folder = resolve('e2e/evidence')
test('capturas reales del MVP en navegador para entrega final', async ({ page }, testInfo) => {
  const password = process.env.TEST_ADMIN_PASSWORD
  expect(password).toBeTruthy()
  const login = await page.request.post('/api/auth/login', {
    data: { email: 'admin@pulpestock.test', password },
  })
  expect(login.status()).toBe(200)
  await mkdir(folder, { recursive: true })
  const prefix = testInfo.project.name

  await page.goto('/')
  await expect(page.getByRole('status', { name: 'Estado de API: API conectada' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Agregar Arroz Faisán 1lb al ticket' })).toBeVisible()
  await page.screenshot({ path: resolve(folder, `${prefix}-pos.png`), fullPage: true })

  for (const [id, heading] of [
    ['Productos', 'Gestión de productos'],
    ['Movimientos', 'Movimientos de inventario'],
    ['Ventas', 'Historial de ventas'],
    ['Reportes', 'Reportes del negocio'],
  ]) {
    if (testInfo.project.name === 'mobile-chromium') {
      await page.getByRole('button', { name: 'Toggle Sidebar' }).first().click()
    }
    await page.getByRole('button', { name: id, exact: true }).click()
    await expect(page.getByRole('heading', { name: heading })).toBeVisible()
    await page.screenshot({ path: resolve(folder, `${prefix}-${id.toLowerCase()}.png`), fullPage: true })
  }
})
