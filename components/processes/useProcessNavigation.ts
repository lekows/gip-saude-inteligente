"use client";
import {useCallback,useEffect,useMemo,useRef,useState,type RefObject} from "react";
import {normalizeProcessHash,processHref} from "@/lib/processes/navigation";

type Options={cnes:string;validation:boolean;activityId?:string;items:{id:string}[];frame:RefObject<HTMLIFrameElement|null>};
export function useProcessNavigation({cnes,validation,activityId,items,frame}:Options){
  const known=useMemo(()=>items.map(i=>i.id),[items]);
  const [hash,setHash]=useState(()=>normalizeProcessHash(activityId?"#n="+activityId:"",known));
  const current=useRef(hash),loaded=useRef(false),ready=useRef(false);
  const [status,setStatus]=useState<"loading"|"ready"|"error">("loading"),[attempt,setAttempt]=useState(0);
  const update=useCallback((raw:string)=>{
    const next=normalizeProcessHash(raw,known);current.current=next;setHash(next);
    const href=processHref(cnes,validation,next);
    if(window.location.pathname+window.location.search+window.location.hash!==href)
      window.history.replaceState(window.history.state,"",href);
    return next;
  },[known,cnes,validation]);
  useEffect(()=>{
    const read=()=>window.location.hash||("#n="+(new URLSearchParams(window.location.search).get("atividade")||""));
    update(read());
    const restore=()=>frame.current?.contentWindow?.postMessage({type:"gip-process-restore",hash:update(read())},window.location.origin);
    const receive=(event:MessageEvent)=>{
      if(!loaded.current||event.origin!==window.location.origin||event.source!==frame.current?.contentWindow||
        event.data?.type!=="gip-process-navigation"||typeof event.data.hash!=="string"||event.data.hash.length>1000)return;
      ready.current=true;setStatus("ready");update(event.data.hash);
    };
    window.addEventListener("message",receive);window.addEventListener("popstate",restore);window.addEventListener("hashchange",restore);
    // The server-rendered iframe may have completed before React attached onLoad.
    // Ignore the initial about:blank document; only handshake with this API frame.
    const element=frame.current;
    try {
      if(element?.contentDocument?.readyState==="complete" &&
        element.contentDocument.location.pathname===new URL(element.src,window.location.href).pathname){
        loaded.current=true;restore();
      }
    }catch{/* A failed or inaccessible document is covered by the recovery notice. */}
    return ()=>{window.removeEventListener("message",receive);window.removeEventListener("popstate",restore);window.removeEventListener("hashchange",restore);};
  },[update,frame]);
  useEffect(()=>{
    if(validation)return;
    const timer=window.setTimeout(()=>{if(!ready.current)setStatus("error");},12000);
    return ()=>window.clearTimeout(timer);
  },[validation,attempt]);
  function onFrameLoad(){
    loaded.current=true;
    frame.current?.contentWindow?.postMessage({type:"gip-process-restore",hash:current.current},window.location.origin);
  }
  function retry(){loaded.current=false;ready.current=false;setStatus("loading");setAttempt(n=>n+1);}
  function selectActivity(id:string){
    if(!known.includes(id))return;
    const q=new URLSearchParams(current.current.slice(1));q.set("n",id);update("#"+q.toString());
  }
  const q=new URLSearchParams(hash.slice(1)),selectedId=q.get("n")||q.get("m")||"__map__";
  return {hash,selectedId,status,attempt,onFrameLoad,retry,selectActivity};
}
