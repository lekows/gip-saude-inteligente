import test from "node:test";
import assert from "node:assert/strict";
import {normalizeProcessHash,processHref} from "../lib/processes/navigation.ts";
import {safeReturnPath} from "../lib/auth/returnPath.ts";
const ids=["M04","M05","M04.A01","M04.A02","Q01"];
test("a shared process link preserves only known navigation state",()=>{
  assert.equal(normalizeProcessHash("#m=M04&n=M04.A02&v=matriz&l=teia&x=sistema,pergunta&wide=1&bad=ignored",ids),"#m=M04&n=M04.A02&v=matriz&l=teia&x=sistema%2Cpergunta&wide=1");
  assert.equal(normalizeProcessHash("#m=unknown&n=unknown&v=script&l=bad&wide=no&x=script",ids),"");
  assert.equal(normalizeProcessHash("#m=M04&n=M05.A99",ids),"#m=M04");
  assert.equal(normalizeProcessHash("#n=M04.A02",ids),"#m=M04&n=M04.A02");
  assert.equal(normalizeProcessHash("#m=M05&n=M04.A02",ids),"#m=M04&n=M04.A02");
  assert.equal(normalizeProcessHash("#v=grafo&l=fluxo&all=1",ids),"#all=1");
  assert.equal(normalizeProcessHash("#n=Q01&v=perguntas",ids),"#n=Q01&v=perguntas");
});
test("switching diagram and area validation carries the selected activity",()=>{
  assert.equal(processHref("5882451",true,"#m=M04&n=M04.A02&v=matriz"),"/unidades/5882451/processos/validacao?atividade=M04.A02#m=M04&n=M04.A02&v=matriz");
  assert.equal(processHref("5882451",false,"#m=M04&n=M04.A02&wide=1"),"/unidades/5882451/processos?atividade=M04.A02#m=M04&n=M04.A02&wide=1");
  assert.equal(processHref("5882451",false,""),"/unidades/5882451/processos");
  assert.equal(processHref("5882451",true,"#n=Q01"),"/unidades/5882451/processos/validacao#n=Q01");
});
test("authentication permits a precise activity destination without accepting arbitrary queries",()=>{
 for(const path of ["/unidades/5882451/processos?atividade=M04.A02","/unidades/5882451/processos/validacao?atividade=M04.A02"]) assert.equal(safeReturnPath(path),path);
 for(const path of ["/unidades/5882451/processos?atividade=//evil.invalid","/unidades/5882451/processos?next=//evil.invalid","/unidades/5882451/processos?atividade=M04.A02&next=//evil.invalid","/unidades/5882451/processos?atividade=M04.A02#x","/unidades/5882451?atividade=M04.A02"]) assert.equal(safeReturnPath(path),null);
});
test("historical round links retain their round across the diagram, validation and login",()=>{
 const graph=processHref("5882451",false,"#m=M06&n=M06.A03",2);
 const validation=processHref("5882451",true,"#m=M06&n=M06.A03",2);
 assert.equal(graph,"/unidades/5882451/processos?rodada=2&atividade=M06.A03#m=M06&n=M06.A03");
 assert.equal(validation,"/unidades/5882451/processos/validacao?rodada=2&atividade=M06.A03#m=M06&n=M06.A03");
 assert.equal(safeReturnPath(validation.split("#")[0]),validation.split("#")[0]);
 assert.equal(safeReturnPath("/unidades/5882451/processos?rodada=1"),"/unidades/5882451/processos?rodada=1");
 for(const query of ["rodada=0","rodada=-2","rodada=2&rodada=1","rodada=2&next=//evil.invalid","rodada=2147483648"])
   assert.equal(safeReturnPath("/unidades/5882451/processos?"+query),null);
});
