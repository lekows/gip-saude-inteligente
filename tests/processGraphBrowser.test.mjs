import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import { processGraphFixture } from './fixtures/processGraphFixture.mjs';
import { PROCESS_GRAPH_HTML } from '../lib/processes/graph-template.ts';

// A real, isolated Chromium in CI. No Supabase, login, production requests or real data.
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH).href);
const data = processGraphFixture();
const routeSource = readFileSync(new URL('../app/api/processos/[id]/grafo/route.ts', import.meta.url), 'utf8');
const csp = routeSource.match(/"Content-Security-Policy":\s*`([^`]+)`/)[1].replaceAll('${nonce}', 'test-nonce');
const template = process.env.PROCESS_GRAPH_BASELINE ? readFileSync(process.env.PROCESS_GRAPH_BASELINE, 'utf8') : PROCESS_GRAPH_HTML;
const html = template.replaceAll('__PROCESS_NONCE__', 'test-nonce').replace('__PROCESS_CONTENT__', () => JSON.stringify(data).replace(/</g, '\\u003c'));
let browser, server, origin;
before(async () => {
  server = createServer((req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'private, no-store');
    if (req.url.startsWith('/frame')) { res.setHeader('Content-Security-Policy', csp); return res.end(html); }
    res.end(`<html><body style="margin:0"><iframe title="Teia em revisão" src="/frame" sandbox="allow-scripts allow-same-origin" style="border:0;width:100%;height:100vh"></iframe><output id="feedback"></output><script>addEventListener('message',e=>{if(e.origin===location.origin&&e.source===document.querySelector('iframe').contentWindow)document.querySelector('output').textContent=JSON.stringify(e.data)})</script></body></html>`);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true });
});
after(async () => { await browser?.close(); if (server) await new Promise(resolve => server.close(resolve)); });
async function scenario(fn, viewport = { width: 1600, height: 1050 }) {
  const context = await browser.newContext({ viewport }), page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(origin);
  const frame = page.frames().find(f => f.url().startsWith(origin + '/frame'));
  page.setDefaultTimeout(5000);
  await frame.locator('#graph .node').first().waitFor({ state: 'attached' });
  try { await fn(frame, page); assert.deepEqual(errors, [], 'No runtime exceptions'); }
  finally { await context.close(); }
}
async function option(f, selector) {
  const target=f.locator(selector);
  if(!await target.isVisible()) {
    if(await target.evaluate(el=>!!el.closest('#matrices'))) await f.locator('#matrices > summary').click();
    else await f.locator('#advanced > summary').click();
  }
  await target.click();
}
async function close(f) { await f.getByRole('button', { name: 'Fechar detalhes', exact: true }).click(); }
async function title(f, text) { await f.waitForFunction(t => document.querySelector('#scopeHeading')?.textContent === t, text); assert.equal(await f.locator('#scopeHeading').textContent(), text); }
test('details can expand, shrink and close without losing activity or keyboard focus', () => scenario(async f => {
  await f.locator('#lista [data-open-macro="M04"]').click();
  await f.locator('#lista [data-activity="M04.A02"]').click();
  const panel=f.locator('#painel'), compact=await panel.boundingBox();
  await f.getByRole('button',{name:'Ampliar detalhes',exact:true}).click();
  assert((await panel.boundingBox()).width>compact.width+100);
  assert.equal(await f.locator('#painel h2').textContent(),'Atividade fictícia 4.2');
  assert(f.url().includes('wide=1'));
  await f.getByRole('button',{name:'Reduzir detalhes',exact:true}).click();
  assert(!f.url().includes('wide=1'));
  await close(f);
  assert.equal(await panel.isVisible(),false);
  assert.equal(await f.locator('#lista [data-activity="M04.A02"]').evaluate(el=>el===document.activeElement),true);
}));

test('primary views are discoverable and the sidebar can collapse without resetting the activity', () => scenario(async f => {
  await f.locator('#lista [data-open-macro="M04"]').click();
  await f.locator('#lista [data-activity="M04.A02"]').click(); await close(f);
  await f.locator('#lista [data-toggle-macro="M04"]').click();
  assert.equal(await f.locator('#lista .grupo[data-open=true]').count(),0);
  assert.equal(await f.locator('#scopeHeading').textContent(),'Processo fictício 4');
  await f.getByRole('button',{name:'Abrir processo Processo fictício 4',exact:true}).click();
  assert.equal(await f.locator('#lista .grupo[data-open=true]').count(),1);
  await f.locator('#viewModes [data-v="tabela"]').click();
  assert.equal(await f.locator('#tabela .activity-card').count(),6);
  await f.locator('#viewModes [data-v="grafo"]').click();
  assert(await f.locator('#cy').isVisible());
}));

test('navigation reports the selected activity and view to its parent and restores a shared context', () => scenario(async (f,page) => {
  await f.locator('#lista [data-open-macro="M04"]').click();
  await f.locator('#lista [data-activity="M04.A02"]').click();
  await page.waitForFunction(()=>document.querySelector('output').textContent.includes('gip-process-navigation'));
  const message=JSON.parse(await page.locator('#feedback').textContent());
  assert.equal(message.type,'gip-process-navigation');
  assert.equal(new URLSearchParams(message.hash.slice(1)).get('n'),'M04.A02');
  await f.getByRole('button',{name:'Ampliar detalhes',exact:true}).click();
  await f.goto(f.url());
  assert.equal(await f.locator('#painel h2').textContent(),'Atividade fictícia 4.2');
  assert(await f.getByRole('button',{name:'Reduzir detalhes',exact:true}).isVisible());
}));

test('every macro opens from sidebar and graph, then every activity opens full progressive details', { timeout: 60000 }, () => scenario(async f => {
  assert.equal(await f.locator('#graph .macro').count(), 5);
  assert((await f.locator('#cy').boundingBox()).height > 300, 'Desktop map has usable height');
  for (const m of data.macros) {
    await f.locator(`#lista [data-open-macro="${m.id}"]`).click(); await title(f, m.title);
    assert.equal(await f.locator('#graph .atividade').count(), data.activities.filter(a => a.macro === m.id).length);
    await f.locator('#aboutProcess').click();
    assert.equal(await f.locator('#painel h2').textContent(), m.title);
    assert((await f.locator('#painel').textContent()).includes(m.account)); await close(f);
    for (const a of data.activities.filter(a => a.macro === m.id)) {
      await f.locator(`#graph [data-id="${a.id}"]`).click();
      assert.equal(await f.locator('#painel h2').textContent(), a.title);
      assert((await f.locator('#painel .detail-lead').textContent()).includes(a.account));
      assert.equal(await f.locator('#painel .detail-section').count(), 5);
      await f.locator('#painel .detail-section > summary').nth(0).click();
      assert.equal(await f.locator('#painel .campo dd').nth(0).textContent(), a.area);
      await f.locator('#painel .detail-section > summary').nth(2).click();
      assert((await f.locator('#painel').textContent()).includes(a.proposal)); await close(f);
      await f.locator(`#lista [data-activity="${a.id}"]`).click();
      assert.equal(await f.locator('#painel h2').textContent(), a.title); await close(f);
    }
    await f.locator('#lista [data-scope=""]').click();
    await f.locator(`#graph [data-id="${m.id}"]`).click(); await title(f, m.title);
    await f.locator('#lista [data-scope=""]').click();
  }
}));

test('list, questions and both full matrices filter, clear and open contextual details', () => scenario(async f => {
  await f.locator('#lista [data-open-macro="M04"]').click();
  for (const [view, selector, count] of [['tabela', '.activity-card', 6], ['matriz', 'tbody tr', 6], ['perguntas', '.activity-card', 8], ['validacao', 'tbody tr', 8]]) {
    await option(f, `[data-v="${view}"]`);
    assert.equal(await f.locator(`#tabela ${selector}`).count(), count);
    await f.locator('#busca').fill('nenhum resultado inexistente'); assert.equal(await f.locator(`#tabela ${selector}`).count(), 0);
    assert.equal(await f.locator('#tabela [role=status]').count(), 1);
    await f.locator('#busca').fill(''); assert.equal(await f.locator(`#tabela ${selector}`).count(), count);
    await f.locator('#tabela button').first().click(); assert(await f.locator('#painel').isVisible()); await close(f);
  }
  await option(f, '[data-v="matriz"]');
  assert.deepEqual(await f.locator('#tabela th').allTextContents(), ['ID', 'Subprocesso e atividade', 'Entendimento coletado', 'Áreas / responsável', 'Sistemas e registros', 'Ponto a validar', 'Situação do levantamento']);
  await f.locator('#switchView').click(); assert(await f.locator('#cy').isVisible());
  await option(f, '[data-v="matriz"]'); await option(f, '[data-l="teia"]'); assert(await f.locator('#cy').isVisible(), 'Selecting a diagram from a matrix opens the map');
  await option(f, '[data-v="tabela"]'); await option(f, '[data-type="sistema"]'); assert(await f.locator('#cy').isVisible(), 'Adding a layer from a list opens the map');
}));

test('sequence, layers and web change positions; every layer and decision opens details', () => scenario(async f => {
  const transforms = [];
  for (const layout of ['fluxo', 'camadas', 'teia']) { await option(f, `[data-l="${layout}"]`); transforms.push(await f.locator('#graph .node').evaluateAll(ns => ns.map(n => n.getAttribute('transform')).join('|'))); }
  assert.equal(new Set(transforms).size, 3, 'Overview layouts differ');
  await f.locator('#lista [data-open-macro="M04"]').click();
  const scopedTransforms = [];
  for (const layout of ['fluxo', 'camadas', 'teia']) { await option(f, `[data-l="${layout}"]`); scopedTransforms.push(await f.locator('#graph .atividade').evaluateAll(ns => ns.map(n => n.getAttribute('transform')).join('|'))); }
  assert.equal(new Set(scopedTransforms).size, 3, 'Process layouts differ');
  await option(f, '[data-l="fluxo"]');
  for (const [type, cls] of [['sistema','sistema'], ['pergunta','pergunta'], ['risco','risco'], ['proposta','proposta'], ['fonte','fonte'], ['decisao','decisao']]) {
    await option(f, `[data-type="${type}"]`); assert((await f.locator(`#graph .${cls}`).count()) > 0);
    await f.locator(`#graph .${cls}`).first().click(); assert(await f.locator('#painel').isVisible()); await close(f);
    await option(f, `[data-type="${type}"]`); assert.equal(await f.locator(`#graph .${cls}`).count(), 0);
  }
}));

test('search across scopes, edge handoffs, sources and contextual feedback bridge', () => scenario(async (f, page) => {
  await f.locator('#busca').fill('M04.A03'); await f.locator('[data-search-node="M04.A03"]').click();
  await title(f, 'Processo fictício 4'); assert.equal(await f.locator('#painel h2').textContent(), 'Atividade fictícia 4.3');
  assert.equal(await f.locator('#busca').inputValue(), '');
  for (const kind of ['understood','question','change']) {
    await f.locator(`#painel [data-feedback-kind="${kind}"]`).click();
    await page.waitForFunction(k => document.querySelector('output').textContent.includes(`"kind":"${k}"`), kind);
    assert.deepEqual(JSON.parse(await page.locator('#feedback').textContent()), { type: 'gip-process-feedback', itemId: 'M04.A03', kind });
  }
  await f.locator('#painel .detail-section > summary').nth(1).click();
  await f.locator('#painel [data-edge-open]').first().click(); assert((await f.locator('#painel').textContent()).includes('Passagem fictícia entre equipes'));
  await f.locator('#painel [data-node]').last().click(); assert(await f.locator('#painel').isVisible()); await close(f);
  await f.locator('#graph [data-edge]').first().focus(); await f.locator('#graph [data-edge]').first().press('Enter');
  assert((await f.locator('#painel').textContent()).includes('Passagem entre atividades')); await close(f);
  await option(f, '#sources'); await f.locator('#painel summary').click(); assert.equal(await f.locator('#painel .source-card').count(), 4); await close(f);
}));

test('stepper, keyboard, zoom, fit, drag, browser back and reload keep navigation usable', () => scenario(async (f, page) => {
  await f.locator('#lista [data-open-macro="M04"]').click();
  await f.locator('#meeting').click(); assert.equal(await f.locator('#walklabel').textContent(), 'Atividade 1 de 6');
  await f.locator('#next').click(); assert.equal(await f.locator('#painel h2').textContent(), 'Atividade fictícia 4.2');
  await f.locator('#prev').click(); assert.equal(await f.locator('#painel h2').textContent(), 'Atividade fictícia 4.1');
  await f.locator('#painel h2').press('ArrowRight'); assert.equal(await f.locator('#painel h2').textContent(), 'Atividade fictícia 4.2');
  await f.locator('#painel h2').press('ArrowLeft'); assert.equal(await f.locator('#painel h2').textContent(), 'Atividade fictícia 4.1');
  await f.locator('#endwalk').click(); await close(f);
  await f.locator('#graph [data-id="M04.A02"]').focus(); await f.locator('#graph [data-id="M04.A02"]').press(' ');
  assert.equal(await f.locator('#painel h2').textContent(), 'Atividade fictícia 4.2'); await f.locator('#painel h2').press('Escape');
  assert.equal(await f.locator('#painel').isVisible(), false);
  const initial = await f.locator('#graph').getAttribute('viewBox'); await f.locator('#zplus').click(); assert.notEqual(await f.locator('#graph').getAttribute('viewBox'), initial);
  await f.locator('#zminus').click(); await f.locator('#ajustar').click(); assert.equal(await f.locator('#graph').getAttribute('viewBox'), initial);
  const node = f.locator('#graph [data-id="M04.A01"]'), before = await node.getAttribute('transform'), box = await node.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + 45, box.y + box.height / 2 + 35, { steps: 5 }); await page.mouse.up();
  assert.notEqual(await node.getAttribute('transform'), before); assert.equal(await f.locator('#painel').isVisible(), false);
  await node.click(); assert.equal(await f.locator('#painel h2').textContent(), 'Atividade fictícia 4.1'); await close(f);
  await f.locator('#lista [data-open-macro="M05"]').click(); await title(f, 'Processo fictício 5');
  // Same-document history belongs to the iframe; there is no top-level load to wait for.
  await page.evaluate(() => history.back()); await title(f, 'Processo fictício 4');
  await page.evaluate(() => history.forward()); await title(f, 'Processo fictício 5');
  await page.evaluate(() => history.back()); await title(f, 'Processo fictício 4');
  await option(f, '[data-v="matriz"]'); await f.goto(f.url()); assert.equal(await f.locator('#tabela tbody tr').count(), 6);
  await f.locator('#lista [data-scope=""]').click(); await option(f, '#fullDetail'); assert.equal(await f.locator('#graph .atividade').count(), 19);
  await option(f, '#fullDetail'); assert.equal(await f.locator('#graph .macro').count(), 5);
  await option(f, '#highlight'); assert((await f.locator('#graph .pergunta').count()) > 0);
}));

test('mobile: area cards, list details, close, sidebar, matrices and map without page overflow', () => scenario(async f => {
  assert(await f.locator('#overviewCards').isVisible());
  await f.locator('#overviewCards [data-scope="M04"]').click(); await title(f, 'Processo fictício 4');
  assert.equal(await f.locator('#tabela .activity-card').count(), 6);
  await f.locator('#tabela .activity-card').nth(3).click(); assert.equal(await f.locator('#painel h2').textContent(), 'Atividade fictícia 4.4'); await close(f);
  await f.locator('#alt-lista').click(); await f.locator('#lista [data-activity="M04.A02"]').click();
  assert.equal(await f.locator('#painel h2').textContent(), 'Atividade fictícia 4.2'); assert.equal(await f.locator('#lista').isVisible(), false); await close(f);
  assert.equal(await f.locator('#scopeHeading').evaluate(el=>el===document.activeElement),true,'Closing mobile sidebar details restores visible focus');
  await f.locator('#alt-lista').click(); assert.equal(await f.locator('#alt-lista').getAttribute('aria-expanded'), 'true');
  await f.locator('#lista [data-open-macro="M03"]').click(); await title(f, 'Processo fictício 3'); assert.equal(await f.locator('#lista').isVisible(), false);
  await option(f, '[data-v="matriz"]'); assert.equal(await f.locator('#tabela tbody tr').count(), 4); await f.locator('#tabela button').first().click(); await close(f);
  await f.locator('#switchView').click(); assert(await f.locator('#cy').isVisible());
  assert.equal(await f.locator('html').evaluate(el => el.scrollWidth > innerWidth), false);
}, { width: 390, height: 844 }));
