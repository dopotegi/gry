/* Nowe tryby działają w osobnych HTML-ach. Tytuły, tagi i zapis należą do hosta. */
(function(){
'use strict';
const channel='do-potegi-html-v1', prefix='html:', q=id=>document.getElementById(id);
const states=new Map(), frames=new Map();
let editorFrame=null, installed=false, fallbackEditing=null;
function copy(v){return JSON.parse(JSON.stringify(v));}
function cleanFile(file){
 if(typeof file!=='string'||!/^[-a-zA-Z0-9_./]+\.html$/.test(file)||file.startsWith('/')||file.split('/').includes('..'))throw new Error('Nieprawidłowa nazwa pliku trybu.');
 return file;
}
const definitions=[];
for(const item of window.DO_POTEGI_TRYBY||[]){
 try{
  if(!item||!/^[-a-zA-Z0-9_]+$/.test(item.id)||!String(item.name||'').trim()||definitions.some(d=>d.id===item.id))throw new Error('Nieprawidłowy wpis na liście trybów.');
  definitions.push({id:item.id,name:String(item.name),file:cleanFile(item.file),description:String(item.description||'Przygotuj zadania i uruchom grę.'),icon:String(item.icon||item.id)});
 }catch(e){console.error(e.message);}
}

function modeIcon(def){
 const shapes={
  'os-liczbowa':'<path d="M2 11h20M18.5 7.5 22 11l-3.5 3.5M5 7v8M10 8v6M15 7v8"/><text x="5" y="22" text-anchor="middle" fill="currentColor" stroke="none" font-family="Arial,sans-serif" font-size="6">0</text><text x="15" y="22" text-anchor="middle" fill="currentColor" stroke="none" font-family="Arial,sans-serif" font-size="6">1</text>', 
  dart:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>',
  'odkryj-obrazek':'<rect x="3" y="3" width="18" height="18" rx="1"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>',
  gamepad:'<path d="M7 7h10c2 0 3 2 3.5 4l1 6c.3 2-2 3-3.2 1.5L16 16H8l-2.3 2.5C4.5 20 2.2 19 2.5 17l1-6C4 9 5 7 7 7Z"/><path d="M6 11h5M8.5 8.5v5"/><circle cx="16" cy="11" r=".7" fill="currentColor"/><circle cx="18" cy="13" r=".7" fill="currentColor"/>'
 };
 return '<svg viewBox="0 0 24 24" width="36" height="36" aria-hidden="true" focusable="false" style="display:block;max-width:100%;color:#fff" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+(shapes[def.icon]||shapes[def.id]||shapes.gamepad)+'</svg>';
}

function definition(type){return definitions.find(d=>prefix+d.id===type);}
function supports(game){return !!game&&typeof game.type==='string'&&game.type.startsWith(prefix);}
function info(game){return {typeLabel:definition(game.type)?.name||game.htmlMode?.name||'Dodatkowy tryb',count:game.modeCount||''};}
function forget(frame){if(!frame)return;const entry=frames.get(frame);if(entry)clearTimeout(entry.timeout);frames.delete(frame);frame.remove();}
function mount(container,def,context,editor){
 container.replaceChildren();
 const status=document.createElement('p');status.className='html-mode-status';status.textContent='Wczytuję tryb…';container.append(status);
 const frame=document.createElement('iframe');frame.className=editor?'html-mode-editor':'html-mode-game';frame.title=def.name;frame.allow='fullscreen';
 const entry={def,context,editor,status,ready:false};frames.set(frame,entry);
 entry.timeout=setTimeout(()=>{if(!entry.ready){status.textContent='Tryb nie odpowiada. Sprawdź, czy wgrano jego plik HTML przygotowany do wspólnej biblioteki.';status.style.color='#E30613';}},12000);
 frame.src=new URL(def.file,document.baseURI).href;container.append(frame);return frame;
}
function showEditor(){
 const type=q('gameType').value, def=definition(type), active=!!def;
 q('htmlModeFields').style.display=active?'block':'none';
 if(!active){forget(editorFrame);editorFrame=null;return;}
 document.querySelectorAll('#creator [id$="Fields"]').forEach(el=>{if(el.id!=='htmlModeFields')el.style.display='none';});
 if(editorFrame&&frames.get(editorFrame)?.def.id===def.id)return;
 forget(editorFrame);
 const state=states.get(def.id)||{payload:null,valid:false,error:'Poczekaj na wczytanie ustawień gry.',count:''};states.set(def.id,state);
 q('preview').replaceChildren();
 editorFrame=mount(q('htmlModeEditor'),def,{mode:'edit',payload:state.payload,title:q('gameTitle').value},true);
}
function getData(){
 const type=q('gameType').value,def=definition(type);if(!def)throw new Error('Nie znaleziono tego trybu na liście.');
 const state=states.get(def.id);
 if(!frames.get(editorFrame)?.ready||!state?.valid)throw new Error(state?.error||'Uzupełnij ustawienia gry.');
 return {type,title:q('gameTitle').value.trim()||def.name,htmlMode:{id:def.id,name:def.name,file:def.file,version:1},modePayload:copy(state.payload),modeCount:state.count||'',classTags:Array.from(document.querySelectorAll('#classTagsBox input:checked')).map(el=>el.value)};
}
function render(game,container,fullscreen){
 const def=definition(game.type);
 for(const [frame,entry] of frames)if(!entry.editor&&(!frame.isConnected||container.contains(frame)))forget(frame);
 if(!def){container.replaceChildren();const msg=document.createElement('p');msg.className='html-mode-error';msg.textContent='Ten zestaw jest zapisany, ale brakuje jego trybu. Wgraj plik gry oraz aktualną listę tryby.js.';container.append(msg);return;}
 mount(container,def,{mode:'play',payload:game.modePayload,title:game.title,fullscreen:!!fullscreen},false);
 if(fullscreen)q('fullscreenSubtitle').textContent=def.name;
}
function load(game){
 const def=definition(game.type);if(!def){showToast('Zestaw jest zachowany. Aby go edytować, przywróć plik trybu i listę tryby.js.');return;}
 states.set(def.id,{payload:copy(game.modePayload),valid:false,error:'Poczekaj na wczytanie ustawień gry.',count:game.modeCount||''});
 q('gameTitle').value=game.title||def.name;q('gameType').value=game.type;
 forget(editorFrame);editorFrame=null;window.onGameTypeChange();window.showScreen('creator');
}
function filters(panel,onSelect,selected){
 for(const def of definitions){
  const type=prefix+def.id;let button=Array.from(panel.querySelectorAll('[data-filter]')).find(el=>el.dataset.filter===type);
  if(!button){button=document.createElement('button');button.type='button';button.className='saved-filter-button';button.dataset.filter=type;button.textContent=def.name;const before=panel.querySelector('.saved-tag-filter-row');panel.insertBefore(button,before);button.addEventListener('click',()=>onSelect(type));}
  button.classList.toggle('active',selected===type);
 }
}
window.DoPotegiModes={supports,info,load,filters,definitions};
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.data?.channel!==channel)return;
 const match=Array.from(frames).find(([frame])=>frame.contentWindow===event.source);if(!match)return;
 const [frame,entry]=match,msg=event.data;
 if(msg.action==='ready'){
  entry.ready=true;clearTimeout(entry.timeout);entry.status.remove();frame.contentWindow.postMessage({channel,action:'init',context:copy(entry.context)},location.origin);
 }else if(msg.action==='changed'&&entry.editor&&frame===editorFrame){
  try{const firstValid=!states.get(entry.def.id)?.valid;const payload=copy(msg.payload);if(!payload||typeof payload!=='object')throw new Error('Nieprawidłowe dane gry.');states.set(entry.def.id,{payload,valid:msg.valid===true,error:String(msg.error||''),count:String(msg.count||'')});if(firstValid&&msg.valid===true)window.buildGame(false);}
  catch(e){states.set(entry.def.id,{payload:null,valid:false,error:e.message,count:''});}
 }else if(msg.action==='toast')showToast(String(msg.message||''));
});
function install(){
 if(installed)return;installed=true;
 const field=document.createElement('div');field.id='htmlModeFields';field.style.display='none';field.innerHTML='<p>Ustawienia i zadania tego trybu:</p><div id="htmlModeEditor"></div>';
 q('gameType').parentElement.insertBefore(field,q('previewBtn').parentElement);
 for(const def of definitions){
  const option=document.createElement('option');option.value=prefix+def.id;option.textContent=def.name;q('gameType').append(option);
  const tile=document.createElement('div');tile.className='game-type';tile.tabIndex=0;tile.setAttribute('role','button');
  const icon=document.createElement('div');icon.className='icon';icon.innerHTML=modeIcon(def);const title=document.createElement('h2');title.textContent=def.name;const description=document.createElement('p');description.textContent=def.description;tile.append(icon,title,description);
  const launch=()=>{fallbackEditing=null;if(typeof window.clearEditingState==='function')window.clearEditingState();states.delete(def.id);forget(editorFrame);editorFrame=null;q('gameTitle').value=def.name;window.selectGameType(prefix+def.id);};
  tile.addEventListener('click',launch);tile.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();launch();}});q('start').querySelector('.game-type-grid').append(tile);
 }
 const oldGet=window.getCurrentGameData;window.getCurrentGameData=function(){if(definition(q('gameType').value))return getData();return oldGet.apply(this,arguments);};
 const oldChange=window.onGameTypeChange;window.onGameTypeChange=function(){const result=oldChange.apply(this,arguments);showEditor();return result;};
 const oldBuild=window.buildGame;window.buildGame=function(fullscreen){if(definition(q('gameType').value)&&!frames.get(editorFrame)?.ready)return;return oldBuild.apply(this,arguments);};
 const oldRender=window.renderGame;window.renderGame=function(game,container,fullscreen){if(supports(game))return render(game,container,fullscreen);return oldRender.apply(this,arguments);};
 q('closeFullBtn').addEventListener('click',()=>{for(const [frame,entry]of frames)if(!entry.editor&&q('fullscreenContent').contains(frame))forget(frame);});
 const oldClose=window.closeFullscreen;window.closeFullscreen=function(){for(const [frame,entry]of frames)if(!entry.editor&&q('fullscreenContent').contains(frame))forget(frame);return oldClose.apply(this,arguments);};
 // Modules can finish after this script. Firebase uses explicit integration points.
 const oldLoad=window.loadSavedGame;
 window.loadSavedGame=function(index){
  if(window.__doPotegiFirebaseReady)return oldLoad.apply(this,arguments);
  const saved=JSON.parse(localStorage.getItem('doPotegiGames')||'[]'),game=saved[index];
  if(!supports(game))return oldLoad.apply(this,arguments);
  if(!definition(game.type)){showToast('Zestaw jest zachowany. Przywróć plik trybu i listę tryby.js.');return;}
  fallbackEditing={id:game.savedId,index};
  const tags=new Set(game.classTags||game.tags||[]);document.querySelectorAll('#classTagsBox input').forEach(el=>el.checked=tags.has(el.value));
  load(game);
 };
 // Jeżeli Firebase jest chwilowo niedostępne, dodatkowe tryby nadal korzystają
 // z tego samego lokalnego magazynu, z zachowaniem tożsamości edytowanego zestawu.
 q('saveBtn').addEventListener('click',event=>{
  if(window.__doPotegiFirebaseReady||!definition(q('gameType').value))return;
  event.preventDefault();event.stopImmediatePropagation();
  try{
   const data=getData(),saved=JSON.parse(localStorage.getItem('doPotegiGames')||'[]');
   const index=fallbackEditing?(fallbackEditing.id?saved.findIndex(g=>g.savedId===fallbackEditing.id):fallbackEditing.index):-1;
   const old=index>=0?saved[index]:null;
   data.savedId=old?.savedId||'game_'+Date.now()+'_'+Math.random().toString(36).slice(2);
   data.savedAt=old?.savedAt||new Date().toISOString();data.updatedAt=new Date().toISOString();data.tags=data.classTags.slice();
   if(old)saved[index]=data;else saved.unshift(data);
   localStorage.setItem('doPotegiGames',JSON.stringify(saved));fallbackEditing={id:data.savedId,index:old?index:0};
   window.renderSavedGames();showToast(old?'Zmiany zapisane lokalnie.':'Gra zapisana lokalnie.');
  }catch(e){showToast(e.message);}
 },true);
 if(typeof window.renderSavedGames==='function')window.renderSavedGames();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0));else setTimeout(install,0);
})();
