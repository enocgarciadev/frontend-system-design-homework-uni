// Ejecutar con Playwright instalado en el entorno de documentación.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const out = path.resolve(__dirname, '..', 'capturas');
(async () => {
  const browser = await chromium.launch({headless: true});
  const results = {url: process.env.APP_URL || 'http://127.0.0.1:5173/', sourceCommit: '0f267f8f336923c98a2c7f0df226caedd539347f', date: '2026-10-06', screenshots: [], checks: [], errors: []};
  for (const [name, width, height] of [['escritorio',1440,900],['movil',390,844]]) {
    const context = await browser.newContext({viewport:{width,height},deviceScaleFactor:1,colorScheme:'light',isMobile:name==='movil',hasTouch:name==='movil'});
    const page = await context.newPage();
    page.on('pageerror', e => results.errors.push(String(e)));
    await page.goto(results.url); await page.getByRole('button',{name:'Agregar Arroz Faisán 1lb al ticket',exact:true}).waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.getByRole('button',{name:'Agregar Arroz Faisán 1lb al ticket',exact:true}).click();
    await page.getByRole('button',{name:'Agregar Frijol Rojo 1lb al ticket',exact:true}).click();
    await page.getByRole('textbox',{name:'Buscar producto por nombre o código de barras'}).fill('arroz');
    await page.getByRole('textbox',{name:'Buscar producto por nombre o código de barras'}).fill('');
    await page.getByRole('button',{name:'Agua Cristal 600ml: agotado',exact:true}).isDisabled().then(v=>{if(!v)throw Error('Agotado no bloqueado')});
    await page.getByLabel('Efectivo recibido',{exact:true}).fill('50');
    await page.getByText('Efectivo insuficiente',{exact:true}).waitFor();
    if(!await page.getByRole('button',{name:'Cobrar y Descontar Stock',exact:true}).isDisabled())throw Error('Efectivo insuficiente permitido');
    results.checks.push(`${name}: efectivo C$50 bloquea cobro de C$80`);
    await page.getByLabel('Efectivo recibido',{exact:true}).fill('100');
    await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent.includes('Cobrar y Descontar Stock')&&!b.disabled));
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({animations:'disabled',path:path.join(out,`${name}-pos.png`)});
    results.screenshots.push({file:`${name}-pos.png`,width,height,scenario:'1 arroz + 1 frijol, total C$80, efectivo C$100, vuelto C$20'});
    if(name==='movil'){
      await page.getByLabel('Efectivo recibido',{exact:true}).scrollIntoViewIfNeeded();
      await page.screenshot({animations:'disabled',path:path.join(out,'movil-cobro.png')});
      results.screenshots.push({file:'movil-cobro.png',width,height,scenario:'Detalle del ticket y cobro, mismo carrito'});
      await page.getByRole('button',{name:'Cobrar',exact:true}).click();
    }else{
      await page.getByRole('button',{name:'Cobrar y Descontar Stock',exact:true}).click();
    }
    await page.getByText('Venta concretada',{exact:true}).waitFor();
    await page.getByText('El ticket está vacío',{exact:true}).waitFor();
    await page.getByText('Stock 23',{exact:true}).waitFor();
    await page.getByText('Stock 17',{exact:true}).waitFor();
    results.checks.push(`${name}: venta C$80 con C$100; ticket vacío y arroz 24 -> 23 y frijol 18 -> 17`);
    await page.reload();
    await page.getByText('Stock 24',{exact:true}).waitFor();
    results.checks.push(`${name}: recarga restablece stock; no hay persistencia de ventas`);
    await context.close();
  }
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await context.newPage(); await page.goto(results.url);
  await page.getByRole('button',{name:'Productos',exact:true}).click();
  await page.getByText(/Este módulo todavía no está implementado/).waitFor();
  await page.screenshot({animations:'disabled',path:path.join(out,'escritorio-productos-pendiente.png')});
  results.checks.push('Productos navega a placeholder explícito');
  results.breakpoints=[];
  for (const width of [639,640,767,768,1023,1024,1535,1536]) {
    await page.setViewportSize({width,height:900});
    await page.reload();
    await page.getByRole('button',{name:'Agregar Arroz Faisán 1lb al ticket',exact:true}).waitFor();
    results.breakpoints.push(await page.evaluate(()=>({width:innerWidth,pageOverflow:document.documentElement.scrollWidth>innerWidth,columns:getComputedStyle(document.querySelector('[class*="grid-cols-2"]')).gridTemplateColumns,sidebarMobile:!document.querySelector('[data-slot=sidebar-container]'),posColumns:getComputedStyle(document.querySelector('div.grid.gap-4')).gridTemplateColumns.split(' ').length})));
  }
  await browser.close();
  fs.writeFileSync(path.join(out,'evidencia.json'),JSON.stringify(results,null,2)+'\n');
  console.log(JSON.stringify(results,null,2));
})().catch(e=>{console.error(e);process.exit(1)});
