import test from "node:test";
import assert from "node:assert/strict";
import {applyEditorialContent,latestEditorial} from "../lib/processes/editorial.ts";
import {activityState} from "../lib/processes/areaValidation.ts";
import {applyAreaContent} from "../lib/processes/areaContent.ts";
const content={schema:"test",unitName:"Unidade fictícia",macros:[{id:"M01",title:"Processo"}],activities:[{id:"M01.A01",macro:"M01",title:"Etapa",account:"Original",owner:"Original",records:"Original",question:"Original"}],questions:[],systems:[],sources:[],flows:{scoped:{M01:{base:{nodeIds:["M01.A01"],edges:[],positions:{}}}}}};
const row={id:1,map_version:1,item_id:"M01.A01",source_feedback_id:"source",source_author_name:"Colaboradora fictícia",decision:"accepted",details:{routine:"Texto consolidado",owner:"Equipe fictícia",records:"Registro fictício",handoff:"Entrega registrada",rules:"Exceção a esclarecer"},pending_question:"Quem confirma?",proposed_improvement:"Proposta de piloto",note:"Consolidação assistida",request_reference:"test",created_at:"2026-01-01",diagram:null};
test("editorial consolidation enriches all fields without changing the source or signing an area",()=>{
 const next=applyEditorialContent(content,[row],1),a=next.activities[0];
 assert.equal(a.account,row.details.routine);assert.equal(a.question,row.pending_question);
 assert.equal(a.proposal,row.proposed_improvement);assert.equal(a.editorial.source_author_name,row.source_author_name);
 assert.equal(content.activities[0].account,"Original");
 assert.equal(activityState(a,{events:[],assignments:[]}).signal,"pending");
});
test("a pending editorial decision replaces the earlier editorial draft and keeps the baseline",()=>{
 const pending={...row,id:2,decision:"needs_information",details:null};
 const next=applyEditorialContent(content,[row,pending],1);
 assert.equal(latestEditorial([row,pending])[0].id,2);
 assert.equal(next.activities[0].account,"Original");assert.equal(next.activities[0].editorial.decision,"needs_information");
});
test("wrong versions and unknown activities cannot affect content",()=>{
 assert.deepEqual(applyEditorialContent(content,[{...row,map_version:2},{...row,item_id:"unknown"}],1),content);
});
test("editorial diagrams accept only nodes belonging to the same macro and replace just that scope",()=>{
 const diagram={base:{nodeIds:["M01.A01"],edges:[],positions:{"M01.A01":{x:200,y:80}},labels:[]}};
 assert.equal(applyEditorialContent(content,[{...row,diagram}],1).flows.scoped.M01.base.positions["M01.A01"].x,200);
 assert.deepEqual(applyEditorialContent(content,[{...row,diagram:{base:{...diagram.base,nodeIds:["M99.A01"]}}}],1).flows,content.flows);
});
test("a real area revision takes precedence over assisted text and supplies the signal",()=>{
 const ledger={assignments:[],events:[{id:1,item_id:"M01.A01",kind:"revision",details:{...row.details,routine:"Rotina revisada pela área"},note:"Revisão humana"}]};
 const next=applyAreaContent(applyEditorialContent(content,[row],1),ledger);
 assert.equal(next.activities[0].account,"Rotina revisada pela área");
 assert.equal(next.activities[0].areaDetails.routine,"Rotina revisada pela área");
 assert.equal(next.areaStatus["M01.A01"].status,"pendente","no representatives means no green signal");
});
test("editorial text and diagrams cannot change details already reviewed by an area",()=>{
 const before={...row,created_at:"2026-01-01",diagram:{base:{nodeIds:["M01.A01"],edges:[],positions:{"M01.A01":{x:100,y:80}},labels:[]}}};
 const after={...before,id:2,created_at:"2026-01-03",details:{...row.details,routine:"Novo rascunho"},pending_question:"Nova pergunta",diagram:{base:{...before.diagram.base,positions:{"M01.A01":{x:900,y:80}}}}};
 const ledger={assignments:[],events:[{id:1,item_id:"M01.A01",kind:"revision",created_at:"2026-01-02",details:row.details}]};
 const next=applyEditorialContent(content,[before,after],1,ledger);
 assert.equal(next.activities[0].account,row.details.routine);
 assert.equal(next.activities[0].question,row.pending_question);
 assert.equal(next.flows.scoped.M01.base.positions["M01.A01"].x,100);
});
test("an incomplete diagram cannot replace a renderable original",()=>{
 const diagram={base:{nodeIds:["M01.A01"],edges:[],positions:{"M01.A01":{x:900,y:80}}}};
 assert.deepEqual(applyEditorialContent(content,[{...row,diagram}],1).flows,content.flows);
});
test("missing node positions cannot hide the activity and base-only layouts have a safe decision fallback",()=>{
 const noPositions={base:{nodeIds:["M01.A01"],edges:[],positions:{},labels:[]}};
 assert.deepEqual(applyEditorialContent(content,[{...row,diagram:noPositions}],1).flows,content.flows);
 const complete={base:{...noPositions.base,positions:{"M01.A01":{x:100,y:80}}}};
 const next=applyEditorialContent(content,[{...row,diagram:complete}],1);
 assert.deepEqual(next.flows.scoped.M01.decisions,complete.base);
});
test("a later unresolved decision also withdraws the previous diagram",()=>{
 const diagram={base:{nodeIds:["M01.A01"],edges:[],positions:{"M01.A01":{x:100,y:80}},labels:[]}};
 assert.deepEqual(applyEditorialContent(content,[{...row,diagram},{...row,id:2,decision:"needs_information",details:null}],1).flows,content.flows);
});
