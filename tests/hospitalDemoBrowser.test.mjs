import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { readFile } from "node:fs/promises";
const requireTool = createRequire(process.env.PLAYWRIGHT_MODULE_PATH);
const { build } = requireTool("esbuild"), { chromium } = requireTool("playwright");

test("director dashboard filters, simulates updates, restores examples and downloads an aggregate template", async () => {
  const bundles = await build({
    stdin: { contents: `
      import React from 'react';
      import {createRoot} from 'react-dom/client';
      import {HospitalDemoDashboard} from './components/processes/HospitalDemoDashboard';
      createRoot(document.getElementById('root')).render(<HospitalDemoDashboard unitName="Hospital fictício" cnes="5882451" initialView={location.pathname.endsWith("/acoes/catarata") ? "catarata" : "hospital"}/>);
    `, loader: "tsx", resolveDir: resolve(".") },
    jsx: "automatic", bundle: true, write: false, outfile: "dashboard.js",
    nodePaths: [dirname(dirname(process.env.PLAYWRIGHT_MODULE_PATH))],
    define: { "process.env.NODE_ENV": '"production"' },
  });
  const js = bundles.outputFiles.find(f => f.path.endsWith(".js")).text;
  const css = bundles.outputFiles.find(f => f.path.endsWith(".css")).text;
  const browser = await chromium.launch();
  try {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 960 } });
      page.setDefaultTimeout(7000);
      const errors = [];
      page.on("pageerror", e => errors.push(e.message));
      await page.route("https://hospital.test/**", r => r.fulfill({ contentType: "text/html", body: '<meta charset="utf-8"><meta name="viewport" content="width=device-width"><div id="root"></div>' }));
      await page.goto("https://hospital.test/");
      await page.addStyleTag({ content: css });
      await page.addScriptTag({ content: js });
      await page.getByText("Demonstração com dados fictícios", { exact: true }).waitFor();
      const nav = page.getByRole("navigation", { name: "Navegação da unidade" });
      assert.equal(await nav.getByRole("link", {name:"Painel da unidade"}).getAttribute("href"), "/unidades/5882451");
      assert.equal(await nav.getByRole("link", {name:"Ações e projetos"}).getAttribute("href"), "/unidades/5882451/acoes");
      assert.equal(await nav.getByRole("link", {name:"Processos",exact:true}).getAttribute("href"), "/unidades/5882451/processos");
      await page.getByRole("button", { name: "Como atualizar", exact: true }).click();
      await page.getByText("A confirmar pelo hospital", {exact:true}).waitFor();
      await page.goto("https://hospital.test/unidades/5882451/acoes/catarata");
      await page.addStyleTag({ content: css });
      await page.addScriptTag({ content: js });
      await page.getByTestId("main-total").waitFor();
      assert.equal(await page.getByRole("navigation", {name:"Navegação da unidade"}).getByRole("link", {name:"Ações e projetos"}).getAttribute("aria-current"), "page");
      assert.equal(await page.getByTestId("main-total").textContent(), "198");
      await page.getByLabel("Período", { exact: true }).selectOption("Segunda");
      assert.equal(await page.getByTestId("main-total").textContent(), "40");
      await page.getByRole("button", { name: "Simular atualização" }).click();
      const dialog = page.getByRole("dialog");
      await dialog.getByLabel("Etapa", { exact: true }).selectOption("cirurgias");
      await dialog.getByLabel("Agendados", { exact: true }).fill("10");
      await dialog.getByLabel("Realizados", { exact: true }).fill("11");
      await dialog.getByRole("button", { name: "Atualizar demonstração" }).click();
      await dialog.getByRole("alert").filter({ hasText: "precisam caber" }).waitFor();
      await dialog.getByLabel("Realizados", { exact: true }).fill("7");
      await dialog.getByLabel("Faltas", { exact: true }).fill("1");
      await dialog.getByLabel("Adiamentos", { exact: true }).fill("1");
      await dialog.getByRole("button", { name: "Atualizar demonstração" }).click();
      await page.waitForFunction(() => document.querySelector('[data-testid="main-total"]').textContent === "7");
      await page.getByRole("button", { name: "Restaurar exemplo" }).click();
      assert.equal(await page.getByTestId("main-total").textContent(), "40");
      const downloadPromise = page.waitForEvent("download");
      await page.getByRole("button", { name: "Baixar modelo de planilha" }).click();
      const download = await downloadPromise;
      const content = await readFile(await download.path(), "utf8");
      assert(content.includes("responsavel_conferencia"));
      assert(!/CPF|telefone|nome_paciente/i.test(content));
      assert.equal(content.trim().split("\n").length, 1, "Blank template, without fabricated records");
      assert.equal(await page.getByRole("link", { name: "← Ações e projetos da unidade", exact: true }).getAttribute("href"), "/unidades/5882451/acoes");
      assert.equal(await page.locator("html").evaluate(el => el.scrollWidth > innerWidth), false);
      assert.deepEqual(errors, []);
      await page.close();
    }
  } finally { await browser.close(); }
});

