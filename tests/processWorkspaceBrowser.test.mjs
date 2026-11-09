import assert from "node:assert/strict";
import test from "node:test";
import {createRequire} from "node:module";
import {dirname,resolve} from "node:path";
import {processGraphFixture} from "./fixtures/processGraphFixture.mjs";
import {PROCESS_GRAPH_HTML} from "../lib/processes/graph-template.ts";
const requireTool=createRequire(process.env.PLAYWRIGHT_MODULE_PATH);
const {build}=requireTool("esbuild"),{chromium}=requireTool("playwright");

test("the real workspace shares activity context, keeps the frame mounted and ignores foreign messages",async()=>{
 const bundles=await build({
  stdin:{contents:`
   import React from 'react';import {createRoot,hydrateRoot} from 'react-dom/client';
   import {renderToString} from 'react-dom/server.browser';
   import {ProcessReviewWorkspace} from './components/processes/ProcessReviewWorkspace';
   const host=document.getElementById('root'),app=<ProcessReviewWorkspace {...window.fixture}/>;
   if(window.delayedHydration){host.innerHTML=renderToString(app);window.hydrateWorkspace=()=>hydrateRoot(host,app);}
   else createRoot(host).render(app);
  `,loader:"tsx",resolveDir:resolve(".")},
  jsx:"automatic",bundle:true,write:false,outfile:"fixture.js",nodePaths:[dirname(dirname(process.env.PLAYWRIGHT_MODULE_PATH))],
  define:{"process.env.NODE_ENV":'"production"'},
  plugins:[{name:"external-services",setup(b){
   b.onResolve({filter:/^(next\/(link|navigation)|@\/app\/processos\/(actions|areaActions))$/},a=>({path:a.path,namespace:"external"}));
   b.onLoad({filter:/.*/,namespace:"external"},({path})=>({loader:"jsx",resolveDir:resolve("."),contents:path==="next/link"?
    "export default function Link({href,children,...rest}){return <a href={href} {...rest}>{children}</a>}":
    path==="next/navigation"?"export function useRouter(){return {refresh:()=>{},push:p=>location.assign(p)}}":
    "export const recordArea=()=>{},assignArea=()=>{},sendProcessFeedback=()=>{},setProcessMember=()=>{},reviewProcessFeedback=()=>{},changeProcessRound=()=>{};"}));
  }}]
 });
 const js=bundles.outputFiles.find(f=>f.path.endsWith(".js")).text,css=bundles.outputFiles.find(f=>f.path.endsWith(".css")).text;
 const data=processGraphFixture();
 const html=PROCESS_GRAPH_HTML.replaceAll("__PROCESS_NONCE__","test").replace("__PROCESS_CONTENT__",()=>JSON.stringify(data).replace(/</g,"\\u003c"));
 const browser=await chromium.launch();
 try{for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:1000}}),errors=[];let frameLoads=0;
  page.on("pageerror",e=>errors.push(e.message));page.setDefaultTimeout(7000);
  await page.route("https://hospital.test/**",r=>{
   if(r.request().url().includes("/api/processos/")){frameLoads++;return r.fulfill({contentType:"text/html",body:html});}
   return r.fulfill({contentType:"text/html",body:'<meta charset="utf-8"><meta name="viewport" content="width=device-width"><div id="root"></div>'});
  });
  await page.goto("https://hospital.test/unidades/0000001/processos");
  const fixture={map:{id:"fixture",version:1,status:"open"},unitName:"Hospital fictício",cnes:"0000001",userId:"rep",manager:false,canContribute:true,
   items:[{id:"__map__",title:"Visão geral"},...data.macros,...data.activities,...data.questions].map(({id,title})=>({id,title})),
   feedback:[],reviews:[],members:[],people:[],validation:null};
  const mount=async()=>{
  const url=new URL(page.url()),validation=url.pathname.endsWith("/validacao");
  await page.evaluate(p=>{
   window.fixture=p;
   Object.defineProperty(navigator,"clipboard",{value:{writeText:async text=>{window.copied=text;}}});
  },{...fixture,activityId:url.searchParams.get("atividade")||undefined,
   validation:validation?{macros:data.macros,activities:data.activities,ledger:{assignments:[],events:[]}}:null});
  await page.addStyleTag({content:css});await page.addScriptTag({content:js});
  };
  await mount();
  const frame=page.frameLocator("iframe");
  await frame.locator('#graph .macro').first().waitFor({state:"attached"});
  if(width===390)await frame.locator('#overviewCards [data-scope="M04"]').click();
  else await frame.locator('#lista [data-open-macro="M04"]').click();
  if(width===390)await frame.locator('#tabela [data-activity="M04.A02"]').click();
  else await frame.locator('#lista [data-activity="M04.A02"]').click();
  await page.waitForFunction(()=>new URL(location.href).searchParams.get("atividade")==="M04.A02");
  assert.equal(frameLoads,1,"State changes must not reload the embedded diagram");
  const href=await page.getByRole("link",{name:"Validação pelas áreas",exact:true}).getAttribute("href");
  assert(href.includes("?atividade=M04.A02"));
  assert(href.includes("#m=M04&n=M04.A02"));
  await page.getByRole("button",{name:"Dar opinião",exact:true}).click();
  assert.equal(await page.locator("dialog select").first().inputValue(),"M04.A02");
  await page.getByRole("button",{name:/Fechar/}).click();
  await page.locator("header > nav details > summary").click();
  await page.getByRole("button",{name:"Copiar link para compartilhar",exact:true}).click();
  assert.equal(await page.evaluate(()=>new URL(window.copied).searchParams.get("atividade")),"M04.A02");
  const before=page.url();
  await page.evaluate(()=>dispatchEvent(new MessageEvent("message",{origin:location.origin,source:window,data:{type:"gip-process-navigation",hash:"#n=M04.A01"}})));
  assert.equal(page.url(),before);
  const shared=await page.evaluate(()=>window.copied);
  await page.goto(shared);await page.reload();await mount();
  await frame.locator('#painel h2').waitFor();
  assert.equal(await frame.locator('#painel h2').textContent(),"Atividade fictícia 4.2");
  await page.getByRole("link",{name:"Validação pelas áreas",exact:true}).click();await mount();
  assert.equal(await page.locator('details[open] summary').filter({hasText:"Atividade fictícia 4.2"}).count(),1);
  await page.getByRole("link",{name:"Teia de processos",exact:true}).click();await mount();
  await frame.locator('#painel h2').waitFor();
  assert.equal(await frame.locator('#painel h2').textContent(),"Atividade fictícia 4.2");
  await frame.getByRole("button",{name:"Fechar detalhes",exact:true}).click();
  if(width===390)await frame.locator('#alt-lista').click();
  await frame.locator('#lista [data-open-macro="M05"]').click();
  await page.waitForFunction(()=>new URLSearchParams(location.hash.slice(1)).get("m")==="M05");
  await page.evaluate(()=>history.back());
  await page.waitForFunction(()=>new URLSearchParams(location.hash.slice(1)).get("m")==="M04");
  assert.equal(await frame.locator('#scopeHeading').textContent(),"Processo fictício 4");
  if(width===1440){
    await page.reload();
    await page.evaluate(p=>{window.fixture=p;window.delayedHydration=true;},fixture);
    await page.addStyleTag({content:css});await page.addScriptTag({content:js});
    await frame.locator('#graph .node').first().waitFor({state:"attached"});
    await page.evaluate(()=>window.hydrateWorkspace());
    await page.getByText("Carregando processos…",{exact:true}).waitFor({state:"hidden"});
    assert.equal(await page.getByText("O diagrama não respondeu.",{exact:false}).count(),0);
  }
  assert.deepEqual(errors,[]);
  assert.equal(await page.locator("html").evaluate(el=>el.scrollWidth>innerWidth),false);
  if(width===1440)await page.screenshot({path:resolve("../navigation-desktop.png")});
  else await page.screenshot({path:resolve("../navigation-mobile.png")});
  await page.close();
 }}finally{await browser.close();}
});
