import {test,expect} from '@playwright/test';
test('permissions denied: no collection or submission; participant can continue',async({page})=>{
 let uploads=0;page.on('request',r=>{if(r.url().endsWith('/api/demo')&&r.method()==='POST')uploads++;});
 await page.addInitScript(()=>{Object.defineProperty(navigator,'mediaDevices',{value:{getUserMedia:()=>Promise.reject(new DOMException('Denied','NotAllowedError'))}});Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition:(_ok:unknown,fail:(e:{code:number})=>void)=>fail({code:1})}});});
 await page.goto('/');await expect(page.getByRole('heading',{level:1})).toContainText('O próximo clique');
 await page.getByRole('button',{name:'Explorar a experiência'}).click();await page.getByRole('button',{name:'Ativar câmera'}).click();await expect(page.locator('.alert[role=alert]')).toContainText('negado');
 await page.getByRole('button',{name:'Obter minha localização'}).click();await expect(page.locator('.alert[role=alert]')).toContainText('negada');
 await page.getByRole('button',{name:'Continuar sem compartilhar'}).click();await expect(page.getByRole('heading',{level:1})).toContainText('VOCÊ CONFIOU');expect(uploads).toBe(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('review can be discarded without sending technical metadata',async({page})=>{let uploads=0;page.on('request',r=>{if(r.url().endsWith('/api/demo')&&r.method()==='POST')uploads++;});await page.goto('/');await page.getByRole('button',{name:'Explorar a experiência'}).click();await page.getByRole('button',{name:'Revisar minhas escolhas'}).click();await expect(page.getByRole('heading',{name:'Seu resumo de compartilhamento'})).toBeVisible();await page.getByRole('button',{name:'Descartar meus dados'}).click();expect(uploads).toBe(0);});
test('private APIs reject anonymous access and login page has no record data',async({request,page})=>{for(const path of ['/api/admin/records','/api/admin/records/00000000-0000-4000-8000-000000000000/photo'])expect((await request.get(path)).status()).toBe(401);expect((await request.delete('/api/admin/records/00000000-0000-4000-8000-000000000000')).status()).toBe(401);await page.goto('/gagueio');await expect(page.getByRole('heading',{name:'Central de operações.'})).toBeVisible();await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content','noindex, nofollow');});
test('explicit camera capture and GPS review, then real send and participant deletion',async({page,context})=>{
 test.skip(!process.env.DATABASE_URL,'Requires isolated PostgreSQL.');
 await context.grantPermissions(['camera','geolocation']);await context.setGeolocation({latitude:-23.55,longitude:-46.63,accuracy:15});
 let uploads=0;page.on('request',r=>{if(r.url().endsWith('/api/demo')&&r.method()==='POST')uploads++;});
 await page.goto('/');await page.getByRole('button',{name:'Explorar a experiência'}).click();
 expect(await page.locator('video').count()).toBe(0);
 await page.getByRole('button',{name:'Ativar câmera'}).click();await expect(page.locator('video')).toBeVisible();
 await expect.poll(()=>page.locator('video').evaluate((v:HTMLVideoElement)=>v.videoWidth)).toBeGreaterThan(0);
 expect(uploads).toBe(0);await page.getByRole('button',{name:'Capturar foto'}).click();await expect(page.getByAltText('Sua foto capturada, ainda somente neste dispositivo')).toBeVisible();expect(await page.locator('video').count()).toBe(0);
 await page.getByRole('button',{name:'Obter minha localização'}).click();await expect(page.getByText('-23.550000, -46.630000')).toBeVisible();
 await page.getByRole('button',{name:'Revisar minhas escolhas'}).click();await expect(page.getByAltText('Foto selecionada para envio')).toBeVisible();expect(uploads).toBe(0);
 await page.getByRole('button',{name:'Confirmar e enviar'}).click();await expect(page.getByRole('heading',{level:1})).toContainText('VOCÊ CONFIOU');expect(uploads).toBe(1);await expect(page.getByText(/Você compartilhou: uma foto/)).toBeVisible();
 await page.getByRole('button',{name:'Excluir minha participação'}).click();await expect(page.getByText('Seus dados foram excluídos.')).toBeVisible();
});
