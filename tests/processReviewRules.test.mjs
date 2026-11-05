import assert from "node:assert/strict";
import test from "node:test";
import { validateProcessFeedback, safeProcessError, ProcessInputError } from "../lib/processes/rules.ts";
import { safeReturnPath } from "../lib/auth/returnPath.ts";
import { susToTerritorialData } from "../lib/dataLoaders/susAdapters.ts";
const input={mapId:'b3f8d8e2-9d9e-4a00-8a00-a7a1ed5f5b2e',version:1,nonce:'a2e8d8e2-9d9e-4a00-8a00-a7a1ed5f5b2e',itemId:'M04.A01',kind:'change',message:'Descrição fictícia de uma passagem.',proposal:'Conferir com a equipe responsável.'};
test('review validates version, item and explicit change proposal',()=>{
 assert.equal(validateProcessFeedback(input).kind,'change');
 for(const patch of [{version:0},{version:1.1},{mapId:'abc'},{nonce:''},{itemId:'<script>'},{kind:'__proto__'},{proposal:''},{message:'curta'}])assert.throws(()=>validateProcessFeedback({...input,...patch}),ProcessInputError);
 assert.equal(validateProcessFeedback({...input,kind:'understood',proposal:''}).proposal,'');
});
test('share login returns only to permitted internal routes and preserves CNES zero',()=>{
 for(const path of ['/processos','/unidades/0640611/processos','/unidades/5882451/processos'])assert.equal(safeReturnPath(path),path);
 for(const path of ['//example.invalid','/\\example.invalid','https://example.invalid','/unidades/123/processos','/processos?next=//example.invalid','/processos\n','/api/processos/id/grafo'])assert.equal(safeReturnPath(path),null);
});
test('unexpected errors do not expose database data or contributions',()=>{
 assert.doesNotMatch(safeProcessError(new Error('PRIVATE SQL PAYLOAD')),/PRIVATE SQL/);
 assert.equal(safeProcessError(new ProcessInputError('Orientação segura.')),'Orientação segura.');
});
test('hospital layer preserves CNES and does not turn hospitals into APS references',()=>{
 const unit=(cnes,type)=>({cnes,type,name:'Unidade fictícia',position:[-16,-48],neighborhoodId:'demo',teams:0,source:'fixture'});
 const result=susToTerritorialData({riskMapAreas:[],healthUnits:[unit('0000001','UBS'),unit('0000002','CAIS'),unit('0000003','HOSPITAL')]});
 assert.deepEqual(result.units.map(x=>x.id),['0000001','0000002']);
 assert.deepEqual(result.hospitals.map(x=>x.cnes),['0000003']);
 assert.equal(result.units.some(x=>x.type==='HOSPITAL'),false);
});
