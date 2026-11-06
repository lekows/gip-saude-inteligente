import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname,resolve } from "node:path";
const requireTool=createRequire(process.env.PLAYWRIGHT_MODULE_PATH);
const {build}=requireTool("esbuild"),{chromium}=requireTool("playwright");

test("area panel links a contribution to its activity and accepts a designated signature on desktop and mobile",async()=>{
  const bundles=await build({
    stdin:{contents:`
      import React from 'react';
      import {createRoot} from 'react-dom/client';
      import {ProcessReviewWorkspace} from './components/processes/ProcessReviewWorkspace';
      const root=createRoot(document.getElementById('root'));
      window.redraw=()=>root.render(<ProcessReviewWorkspace {...window.fixture}/>);
      window.redraw();
    `,loader:"tsx",resolveDir:resolve(".")},
    jsx:"automatic",bundle:true,write:false,outfile:"fixture.js",nodePaths:[dirname(dirname(process.env.PLAYWRIGHT_MODULE_PATH))],
    define:{"process.env.NODE_ENV":'"production"'},
    plugins:[{name:"fixture-services",setup(b){
      b.onResolve({filter:/^(next\/(link|navigation)|@\/app\/processos\/(actions|areaActions))$/},args=>({path:args.path,namespace:"fixture"}));
      b.onLoad({filter:/.*/,namespace:"fixture"},({path})=>({loader:"jsx",resolveDir:resolve("."),contents:path==="next/link"?
        "export default function Link({href,children,...rest}){return <a href={href} {...rest}>{children}</a>}":
        path==="next/navigation"?"export function useRouter(){return {refresh:()=>window.redraw(),push:path=>location.assign(path)}}":`
          export async function recordArea(map,item,kind,mandate,expected,note,details){
            const ledger=window.fixture.validation.ledger;
            ledger.events.push({id:expected+1,item_id:item,kind,mandate,note,details,actor_name:"Equipe teste",area:"Área A",created_at:new Date().toISOString()});
            return {success:"Registrado"};
          }
          export const assignArea=()=>{},sendProcessFeedback=()=>{},setProcessMember=()=>{},reviewProcessFeedback=()=>{},changeProcessRound=()=>{};
        `}));
    }}]
  });
  const js=bundles.outputFiles.find(f=>f.path.endsWith(".js")).text,css=bundles.outputFiles.find(f=>f.path.endsWith(".css")).text;
  const browser=await chromium.launch();
  try{
    for(const width of [1440,390]){
      const page=await browser.newPage({viewport:{width,height:900}});
      page.setDefaultTimeout(7000);
      page.on("pageerror",e=>console.error("React fixture error",e.message));
      const item={id:"M01.A01",macro:"M01",title:"Conferir pedido fictício",account:"Receber o pedido.",records:"Formulário",owner:"Equipe",area:"Área A",question:"Quem recebe?"};
      const fixture={map:{id:"map",version:1,status:"open"},unitName:"Hospital fictício",cnes:"0000001",userId:"rep",manager:false,canContribute:true,items:[item],feedback:[],reviews:[],members:[],people:[],
        validation:{macros:[{id:"M01",title:"Pedidos"}],activities:[item],ledger:{assignments:[{macro_id:"M01",mandate:"mandate",area:"Área A",active:true,assignee:"rep",assignee_name:"Equipe teste"}],events:[]}}};
      await page.route("https://hospital.test/**",r=>r.fulfill({contentType:"text/html",body:'<meta charset="utf-8"><meta name="viewport" content="width=device-width"><div id="root"></div>'}));
      await page.goto("https://hospital.test/");
      await page.evaluate(p=>window.fixture=p,fixture);
      await page.addStyleTag({content:css});await page.addScriptTag({content:js});
      await page.getByText("Conferir atividades (1)").click();await page.getByText(item.title,{exact:true}).first().click();
      await page.getByRole("button",{name:"Falta uma informação"}).click();
      assert.equal(await page.locator("dialog select").first().inputValue(),item.id);
      assert.equal(await page.locator("dialog select").nth(1).inputValue(),"new_step");
      await page.getByRole("button",{name:/Fechar/}).click();
      await page.getByText("Completar detalhes da rotina").click();
      await page.getByLabel("Equipe ou função responsável").fill("Equipe fictícia");
      await page.getByLabel("Quem entrega, quem recebe e como confirma").fill("Entrega entre equipes");
      await page.getByLabel("Prazos, exceções e dúvidas esclarecidas").fill("Exceção documentada");
      await page.getByLabel("Motivo desta revisão").fill("Detalhamento fictício");
      await page.getByRole("button",{name:"Salvar detalhes para conferência"}).click();
      await page.getByRole("checkbox").check();await page.getByRole("button",{name:"Validar pela minha área"}).click();
      await page.getByText("1 de 1",{exact:true}).waitFor();
      await page.getByText("Registrar ajuste necessário",{exact:true}).click();
      await page.getByLabel("Qual descrição precisa mudar?").fill("Revisar a passagem para a outra equipe.");
      await page.getByRole("button",{name:"Registrar ajuste",exact:true}).click();
      await page.locator("article [data-state=correction]").first().waitFor();
      await page.getByRole("button",{name:/Validado pela área 0/}).click();
      await page.getByText("Nenhum processo corresponde aos filtros.").waitFor();
      await page.getByRole("button",{name:"Limpar filtros"}).click();
      assert.equal(await page.locator("article").count(),1);
      assert.equal(await page.locator("a").filter({hasText:"Abrir na teia"}).getAttribute("href"),"/unidades/0000001/processos?atividade=M01.A01");
      await page.close();
    }
  }finally{await browser.close();}
});

