import test from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {resolve} from "node:path";
import {NextRequest} from "next/server.js";
const requireTool=createRequire(process.env.PLAYWRIGHT_MODULE_PATH);
const {build}=requireTool("esbuild");
const bundle=await build({entryPoints:["middleware.ts"],absWorkingDir:resolve("."),bundle:true,write:false,format:"cjs",platform:"node",external:["next/server"],
 plugins:[{name:"session-boundary",setup(b){
  b.onResolve({filter:/^@\/lib\/supabase\/middleware$/},a=>({path:a.path,namespace:"session"}));
  b.onLoad({filter:/.*/,namespace:"session"},()=>({loader:"js",resolveDir:resolve("."),contents:`
   import {NextResponse} from 'next/server';
   export async function updateSession(){const profile=globalThis.__navigationAuthProfile;return {
    supabaseResponse:NextResponse.next(),user:profile?{id:'fictional'}:null,
    supabase:profile?{from(){return {select(){return {eq(){return {single:async()=>({data:profile})}}}}}}}:null
   }}
   export function createRedirectWithCookies(request,url){return NextResponse.redirect(url)}
  `}));
 }}]});
const module={exports:{}};new Function("require","module","exports",bundle.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports);
const {middleware}=module.exports;
test("middleware preserves an activity through login, pending approval and an already approved session",async()=>{
 for(const suffix of ["/processos","/processos/validacao"]){
  const destination="/unidades/5882451"+suffix+"?atividade=M04.A02";
  globalThis.__navigationAuthProfile=null;
  let response=await middleware(new NextRequest("https://hospital.test"+destination));
  let url=new URL(response.headers.get("location"));
  assert.equal(url.pathname,"/entrar");assert.equal(url.searchParams.get("next"),destination);
  assert.deepEqual([...url.searchParams.keys()],["next"]);
  globalThis.__navigationAuthProfile={role:"academico_participante",active:true,account_status:"pendente"};
  response=await middleware(new NextRequest("https://hospital.test/entrar?next="+encodeURIComponent(destination)));
  url=new URL(response.headers.get("location"));assert.equal(url.pathname,"/aguardando-aprovacao");
  assert.equal(url.searchParams.get("next"),destination);
  globalThis.__navigationAuthProfile={role:"academico_participante",active:true,account_status:"aprovado"};
  response=await middleware(new NextRequest("https://hospital.test/entrar?next="+encodeURIComponent(destination)));
  assert.equal(response.headers.get("location"),"https://hospital.test"+destination);
 }
 delete globalThis.__navigationAuthProfile;
});
