
(function(){
  function q(id){return document.getElementById(id)}
  function escapeHtmlTF(s){
    return String(s==null?'':s)
      .replaceAll('&','&amp;').replaceAll('<','&lt;')
      .replaceAll('>','&gt;').replaceAll('"','&quot;');
  }
  function currentTagsTF(){
    if(typeof selectedClassTags==='function') return selectedClassTags();
    return Array.from(document.querySelectorAll('#classTagsBox input[type="checkbox"]:checked')).map(x=>x.value);
  }
  function setTagsTF(tags){
    if(typeof setSelectedClassTags==='function'){
      setSelectedClassTags(tags||[]);
      return;
    }
    const set=new Set(tags||[]);
    document.querySelectorAll('#classTagsBox input[type="checkbox"]').forEach(x=>x.checked=set.has(x.value));
  }
  function shuffleTF(a){
    a=(a||[]).slice();
    for(let i=a.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [a[i],a[j]]=[a[j],a[i]];
    }
    return a;
  }
  function normalizeAnswerTF(v){
    const s=String(v||'').trim().toLowerCase();
    if(['p','prawda','true','t','1','tak'].includes(s)) return true;
    if(['f','fałsz','falsz','false','0','nie'].includes(s)) return false;
    throw new Error('Przy każdym zdaniu wpisz po średniku: Prawda albo Fałsz.');
  }
  function parseTF(){
    const lines=(q('trueFalseInput')?.value||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
    if(!lines.length) throw new Error('Dodaj przynajmniej jedno zdanie do gry Prawda / Fałsz.');
    return lines.map((line,idx)=>{
      const cut=line.lastIndexOf(';');
      if(cut<0) throw new Error('Wiersz '+(idx+1)+' nie ma odpowiedzi po średniku.');
      const statement=line.slice(0,cut).trim();
      const answer=line.slice(cut+1).trim();
      if(!statement) throw new Error('Wiersz '+(idx+1)+' nie zawiera zdania.');
      return {statement:statement,answer:normalizeAnswerTF(answer)};
    });
  }
  function ensureTFUI(){
    const select=q('gameType');
    if(!select) return;
    if(!select.querySelector('option[value="truefalse"]')){
      const opt=document.createElement('option');
      opt.value='truefalse';
      opt.textContent='Prawda / Fałsz';
      select.appendChild(opt);
    }

    const startGrid=document.querySelector('#start .game-type-grid');
    if(startGrid && !q('startTrueFalse')){
      const tile=document.createElement('div');
      tile.className='game-type';
      tile.id='startTrueFalse';
      tile.innerHTML='<div class="icon">✓✕</div><h2>Prawda / Fałsz</h2><p>Oceń, czy kolejne stwierdzenia są prawdziwe czy fałszywe.</p>';
      startGrid.appendChild(tile);
      tile.addEventListener('click',function(){
        select.value='truefalse';
        if(typeof window.onGameTypeChange==='function') window.onGameTypeChange();
        if(typeof showScreen==='function') showScreen('creator');
        if(typeof buildGame==='function') buildGame(false);
      });
    }

    if(!q('trueFalseFields')){
      const actions=document.querySelector('#creator .creator-actions');
      if(actions){
        const box=document.createElement('div');
        box.id='trueFalseFields';
        box.style.display='none';
        box.innerHTML=`
          <label for="trueFalseInput">Zdania</label>
          <textarea id="trueFalseInput">Liczba 36 jest podzielna przez 9. ; Prawda
\\sqrt{81}=8 ; Fałsz
\\frac{1}{2}=0.5 ; Prawda
Każda liczba pierwsza jest nieparzysta. ; Fałsz
2^5=32 ; Prawda
Równanie x+3=10 ma rozwiązanie x=6. ; Fałsz</textarea>
          <div class="tf-help">
            Jedno stwierdzenie w jednej linijce. Po średniku wpisz <strong>Prawda</strong> albo <strong>Fałsz</strong>.
            Zapis matematyczny możesz wpisywać przez MathJax.
          </div>
          <label class="th-inline-check"><input id="trueFalseShuffle" type="checkbox" checked> Losuj kolejność zdań</label>
          <label class="th-inline-check"><input id="trueFalseShowCorrect" type="checkbox" checked> Po odpowiedzi pokaż, która opcja była poprawna</label>
        `;
        actions.parentNode.insertBefore(box,actions);
      }
    }

    const filter=q('savedFilterPanel');
    if(filter && !filter.querySelector('[data-filter="truefalse"]')){
      const b=document.createElement('button');
      b.className='saved-filter-button';
      b.type='button';
      b.dataset.filter='truefalse';
      b.textContent='Prawda / Fałsz';
      filter.appendChild(b);
    }
  }

  function dataTF(){
    return {
      type:'truefalse',
      title:q('gameTitle')?.value||'Prawda / Fałsz',
      classTags:currentTagsTF(),
      tags:currentTagsTF(),
      shuffle:q('trueFalseShuffle')?.checked!==false,
      showCorrect:q('trueFalseShowCorrect')?.checked!==false,
      items:parseTF()
    };
  }

  function mathWrapTF(txt){
    const s=String(txt||'').trim();
    if(!s) return '';
    if(s.startsWith('\\(')||s.startsWith('\\[')||s.startsWith('$')) return s;

    const hasLatex = /\\[A-Za-z]+/.test(s);
    const looksMathOnly = /^[0-9xXyYmMnNa-zA-Z+\-*/:=<>(){}\[\].,^_\s\\]+$/.test(s)
      && !/[ąćęłńóśżźĄĆĘŁŃÓŚŻŹ]/.test(s)
      && (/[=<>+\-*/^]/.test(s) || hasLatex);

    if(hasLatex || looksMathOnly){
      return '\\(' + s + '\\)';
    }
    return s;
  }
  function typesetTF(el){
    if(window.MathJax && MathJax.typesetClear){
      try{MathJax.typesetClear([el])}catch(e){}
    }
    if(window.MathJax && MathJax.typesetPromise){
      MathJax.typesetPromise([el]).catch(function(){});
    }else if(typeof typeset==='function'){
      typeset(el);
    }
  }

  function renderTF(data,container,isFullscreen){
    let items=(data.items||[]).slice();
    if(data.shuffle!==false) items=shuffleTF(items);
    let index=0,score=0,locked=false;

    container.innerHTML=`
      <div class="tf-stage">
        <div class="tf-top">
          <div class="tf-progress">Pytanie <span class="tf-current">1</span> / <span>${items.length}</span></div>
          <div class="tf-score">Punkty: <span class="tf-score-value">0</span></div>
        </div>
        <div class="tf-card"></div>
        <div class="tf-buttons">
          <button type="button" class="tf-answer tf-true">PRAWDA</button>
          <button type="button" class="tf-answer tf-false">FAŁSZ</button>
        </div>
        <div class="tf-feedback"></div>
        <button type="button" class="btn tf-next" style="display:none">Następne</button>
      </div>
    `;
    const card=container.querySelector('.tf-card');
    const current=container.querySelector('.tf-current');
    const scoreEl=container.querySelector('.tf-score-value');
    const feedback=container.querySelector('.tf-feedback');
    const btnTrue=container.querySelector('.tf-true');
    const btnFalse=container.querySelector('.tf-false');
    const next=container.querySelector('.tf-next');

    function show(){
      if(index>=items.length){
        card.innerHTML='Koniec gry';
        current.textContent=String(items.length);
        feedback.className='tf-feedback good';
        feedback.textContent='Wynik: '+score+' / '+items.length;
        btnTrue.style.display='none';
        btnFalse.style.display='none';
        next.style.display='none';
        return;
      }
      locked=false;
      current.textContent=String(index+1);
      scoreEl.textContent=String(score);
      feedback.textContent='';
      feedback.className='tf-feedback';
      next.style.display='none';
      btnTrue.disabled=false;
      btnFalse.disabled=false;
      btnTrue.classList.remove('correct','wrong');
      btnFalse.classList.remove('correct','wrong');
      card.innerHTML=mathWrapTF(items[index].statement);
      typesetTF(card);
    }

    function answer(value){
      if(locked) return;
      locked=true;
      const item=items[index];
      const correct=value===item.answer;
      if(correct) score++;
      scoreEl.textContent=String(score);
      btnTrue.disabled=true;
      btnFalse.disabled=true;

      const chosen=value?btnTrue:btnFalse;
      chosen.classList.add(correct?'correct':'wrong');

      if(data.showCorrect!==false){
        const proper=item.answer?btnTrue:btnFalse;
        proper.classList.add('correct');
      }

      feedback.className='tf-feedback '+(correct?'good':'bad');
      feedback.textContent=correct?'Dobrze!':'Nie tym razem.';
      next.style.display='inline-flex';
      next.textContent=index===items.length-1?'Zobacz wynik':'Następne';
    }

    btnTrue.addEventListener('click',()=>answer(true));
    btnFalse.addEventListener('click',()=>answer(false));
    next.addEventListener('click',function(){index++;show()});
    show();
  }

  function hookTF(){
    ensureTFUI();
    if(window.__trueFalseHookedV1) return;
    window.__trueFalseHookedV1=true;

    const oldGet=window.getCurrentGameData;
    window.getCurrentGameData=function(){
      if(q('gameType')?.value==='truefalse') return dataTF();
      return oldGet.apply(this,arguments);
    };

    const oldChange=window.onGameTypeChange;
    window.onGameTypeChange=function(){
      if(typeof oldChange==='function') oldChange.apply(this,arguments);
      ensureTFUI();
      const active=q('gameType')?.value==='truefalse';
      const f=q('trueFalseFields');
      if(f) f.style.display=active?'block':'none';
      if(active){
        ['matchFields','sortFields','quizFields','memoryFields','puzzleFields','safeFields','flyingFields',
         'trainingFields','fractionModelsFields','connect4Fields','treasureFields']
        .forEach(function(id){const el=q(id);if(el)el.style.display='none'});
      }
    };

    const oldRender=window.renderGame;
    window.renderGame=function(data,container,isFullscreen){
      if(data && data.type==='truefalse'){
        renderTF(data,container,isFullscreen);
        return;
      }
      return oldRender.apply(this,arguments);
    };

    const oldLoad=window.loadSavedGame;
    window.loadSavedGame=function(index){
      const list=(typeof currentSavedGames==='function'?currentSavedGames():[]);
      const g=list[index];
      if(!g || g.type!=='truefalse') return oldLoad.apply(this,arguments);

      if(typeof markGameAsEdited==='function') markGameAsEdited(g,index);
      q('gameTitle').value=g.title||'Prawda / Fałsz';
      q('gameType').value='truefalse';
      setTagsTF(g.classTags||g.tags||[]);
      window.onGameTypeChange();
      q('trueFalseShuffle').checked=g.shuffle!==false;
      q('trueFalseShowCorrect').checked=g.showCorrect!==false;
      q('trueFalseInput').value=(g.items||[]).map(function(item){
        return item.statement+' ; '+(item.answer?'Prawda':'Fałsz');
      }).join('\n');

      if(typeof showScreen==='function') showScreen('creator');
      if(typeof buildGame==='function') buildGame(false);
    };

    if(typeof window.typeInfo==='function'){
      const oldInfo=window.typeInfo;
      window.typeInfo=function(game){
        if(game && game.type==='truefalse'){
          return {typeLabel:'Prawda / Fałsz',count:(game.items||[]).length+' zdań'};
        }
        return oldInfo(game);
      };
    }

    const oldSaved=window.renderSavedGames;
    window.renderSavedGames=function(){
      const r=oldSaved.apply(this,arguments);
      ensureTFUI();
      document.querySelectorAll('.saved-game[data-game-type="truefalse"] .saved-type-badge')
        .forEach(function(b){b.textContent='Prawda / Fałsz'});
      return r;
    };

    window.onGameTypeChange();
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){setTimeout(hookTF,0)});
  }else{
    setTimeout(hookTF,0);
  }
})();
