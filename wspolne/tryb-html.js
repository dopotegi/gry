/* Wspólny adapter do umieszczenia w każdym nowym trybie HTML. */
(function(){
  'use strict';
  let handler=null, context=null;
  function copy(value){ return JSON.parse(JSON.stringify(value)); }
  function send(message){ if(window.parent!==window) window.parent.postMessage({channel:'do-potegi-html-v1',...message},location.origin); }
  const api=window.DoPotegiTryb={
    register(callback){handler=callback;send({action:'ready'});if(context)handler(copy(context));},
    changed(payload, options={}){send({action:'changed',payload:copy(payload),valid:options.valid!==false,error:options.error||'',count:typeof options.count==='string'?options.count:''});},
    toast(message){send({action:'toast',message:String(message)});},
    typeset(element){return window.MathJax?.typesetPromise?window.MathJax.typesetPromise([element]):Promise.resolve();}
  };
  window.addEventListener('message',event=>{
    if(event.source!==window.parent||event.origin!==location.origin||event.data?.channel!=='do-potegi-html-v1'||event.data.action!=='init')return;
    context=copy(event.data.context);
    if(handler)handler(context);
  });
})();
