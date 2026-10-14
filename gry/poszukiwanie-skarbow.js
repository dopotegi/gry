
(function(){
  function q(id){ return document.getElementById(id); }
  function esc(s){
    return String(s == null ? '' : s)
      .replaceAll('&','&amp;').replaceAll('<','&lt;')
      .replaceAll('>','&gt;').replaceAll('"','&quot;');
  }
  function shuffle(arr){
    const a=(arr||[]).slice();
    for(let i=a.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [a[i],a[j]]=[a[j],a[i]];
    }
    return a;
  }
  function logoSrc(){
    const img=document.querySelector('.brand img, .fullscreen-brand img');
    return img ? img.src : '';
  }
  function selectedTagsNow(){
    return Array.from(document.querySelectorAll('#classTagsBox input[type="checkbox"]:checked'))
      .map(function(input){return input.value;});
  }
  function setTagsNow(tags){
    const set=new Set(Array.isArray(tags)?tags:[]);
    document.querySelectorAll('#classTagsBox input[type="checkbox"]').forEach(function(input){
      input.checked=set.has(input.value);
    });
  }

  function ensureUi(){
    const select=q('gameType');
    if(!select) return;

    if(!select.querySelector('option[value="treasure"]')){
      const opt=document.createElement('option');
      opt.value='treasure';
      opt.textContent='Poszukiwanie skarbów';
      select.appendChild(opt);
    }

    const grid=document.querySelector('#start .game-type-grid');
    if(grid && !q('startTreasure')){
      const tile=document.createElement('div');
      tile.className='game-type';
      tile.id='startTreasure';
      tile.innerHTML='<div class="icon">◆</div><h2>Poszukiwanie skarbów</h2><p>Odkrywaj pola, rozwiązuj zadania i znajdź ukryte skarby.</p>';
      grid.appendChild(tile);
      tile.addEventListener('click',function(){
        select.value='treasure';
        if(typeof window.onGameTypeChange==='function') window.onGameTypeChange();
        if(typeof showScreen==='function') showScreen('creator');
        if(typeof buildGame==='function') buildGame(false);
      });
    }

    if(!q('treasureFields')){
      const actions=document.querySelector('#creator .creator-actions');
      if(actions){
        const fields=document.createElement('div');
        fields.id='treasureFields';
        fields.style.display='none';
        fields.innerHTML=`
          <label for="treasureInput">Zadania / przykłady</label>
          <textarea id="treasureInput">7 \\cdot 8
9^2
\\sqrt{64}
\\frac{3}{4}+\\frac{1}{4}
15\\% \\text{ z } 200
2^5
144:12
3x+5=20
\\sqrt[3]{27}
\\frac{5}{6}-\\frac{1}{3}
12^2
7\\cdot 9
25\\% \\text{ z } 80
\\sqrt{121}
4^3
180:15
2x-7=9
\\frac{2}{5}+\\frac{1}{10}
11^2
6\\cdot 12
\\sqrt{169}
3^4
240:20
5x+3=28</textarea>
          <div class="hint">Jedno zadanie w jednej linijce. Możesz używać zapisu MathJax.</div>
          <div class="th-fields-grid">
            <div>
              <label for="treasureGridSize">Wielkość planszy</label>
              <select id="treasureGridSize">
                <option value="3">3 × 3</option>
                <option value="4">4 × 4</option>
                <option value="5" selected>5 × 5</option>
                <option value="6">6 × 6</option>
                <option value="7">7 × 7</option>
              </select>
            </div>
            <div>
              <label for="treasureCount">Liczba skarbów</label>
              <input id="treasureCount" type="number" min="1" max="10" value="1">
            </div>
          </div>
          <label class="th-inline-check"><input id="treasureHints" type="checkbox" checked> Podpowiedzi „gorąco / ciepło / zimno”</label>
          <label class="th-inline-check"><input id="treasureCross" type="checkbox" checked> Pozwól przekreślać odkryte pola</label>
          <label class="th-inline-check"><input id="treasureNumbers" type="checkbox" checked> Numery na zakrytych polach</label>
          <div class="th-capacity" id="treasureCapacity"></div>
        `;
        actions.parentNode.insertBefore(fields,actions);
      }
    }

    updateCapacity();
    ['treasureGridSize','treasureCount'].forEach(function(id){
      const el=q(id);
      if(el && !el.dataset.thBound){
        el.dataset.thBound='1';
        el.addEventListener('input',updateCapacity);
        el.addEventListener('change',updateCapacity);
      }
    });
  }

  function updateCapacity(){
    const size=parseInt(q('treasureGridSize')?.value||5,10);
    const max=Math.max(1,size*size-1);
    const countEl=q('treasureCount');
    if(countEl){
      countEl.max=String(Math.min(10,size*size-1));
      let c=parseInt(countEl.value||1,10);
      c=Math.max(1,Math.min(c,size*size-1,10));
      countEl.value=String(c);
      const cap=size*size-c;
      const el=q('treasureCapacity');
      if(el) el.textContent='Na tej planszy jest '+cap+' pól z zadaniami i '+c+(c===1?' skarb.':' skarby/skarbów.')+' Jeśli podasz mniej zadań, gra wykorzysta je ponownie.';
    }
  }

  function parseTasks(){
    const raw=(q('treasureInput')?.value||'').split(/\r?\n/)
      .map(function(x){return x.trim();}).filter(Boolean);
    if(!raw.length) throw new Error('Dodaj przynajmniej jedno zadanie do Poszukiwania skarbów.');
    return raw;
  }

  function treasureData(){
    const n=Math.max(3,Math.min(7,parseInt(q('treasureGridSize')?.value||5,10)));
    const tc=Math.max(1,Math.min(10,n*n-1,parseInt(q('treasureCount')?.value||1,10)));
    return {
      type:'treasure',
      title:q('gameTitle')?.value||'Poszukiwanie skarbów',
      classTags:selectedTagsNow(),
      tags:selectedTagsNow(),
      gridSize:n,
      treasureCount:tc,
      hints:!!q('treasureHints')?.checked,
      allowCross:!!q('treasureCross')?.checked,
      showNumbers:!!q('treasureNumbers')?.checked,
      tasks:parseTasks()
    };
  }

  function distance(a,b,n){
    const ax=a%n, ay=Math.floor(a/n), bx=b%n, by=Math.floor(b/n);
    return Math.abs(ax-bx)+Math.abs(ay-by);
  }
  function hintLabel(d){
    if(d===1) return 'GORĄCO';
    if(d===2) return 'CIEPŁO';
    if(d<=4) return 'CHŁODNO';
    return 'ZIMNO';
  }

  function buildRound(data){
    const n=data.gridSize||5;
    const total=n*n;
    const treasures=new Set();
    while(treasures.size<(data.treasureCount||1)){
      treasures.add(Math.floor(Math.random()*total));
    }

    const source=(data.tasks||[]).slice();
    const needed=total-treasures.size;
    let tasks=[];
    while(tasks.length<needed){
      tasks=tasks.concat(shuffle(source));
      if(!source.length) break;
    }
    tasks=tasks.slice(0,needed);

    const cells=[];
    let p=0;
    for(let i=0;i<total;i++){
      cells.push(treasures.has(i)
        ? {treasure:true,text:''}
        : {treasure:false,text:tasks[p++]||''});
    }
    return {cells:cells,treasures:treasures};
  }

  function renderTreasure(data,container,isFullscreen){
    const n=data.gridSize||5;
    let round=buildRound(data);
    let found=0;
    let hintsOn=data.hints!==false;

    container.innerHTML=`
      <div class="th-stage">
        <div class="th-toolbar">
          <div class="th-progress">Skarby: <span class="th-found">0</span> / <span>${data.treasureCount||1}</span></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn secondary small th-hints-toggle" type="button"></button>
            <button class="btn secondary small th-reset" type="button">Zasłoń pola</button>
            <button class="btn small th-new" type="button">Nowe rozmieszczenie</button>
          </div>
        </div>
        <div class="th-board-wrap"><div class="th-board" style="--th-n:${n}"></div></div>
        <div class="th-message">Wybierz pole i szukaj skarbów.</div>
      </div>
    `;
    const board=container.querySelector('.th-board');
    const foundEl=container.querySelector('.th-found');
    const msg=container.querySelector('.th-message');
    const hintsBtn=container.querySelector('.th-hints-toggle');

    function refreshHintsButton(){
      if(!hintsBtn) return;
      hintsBtn.textContent=hintsOn ? 'Podpowiedzi: WŁ.' : 'Podpowiedzi: WYŁ.';
      hintsBtn.setAttribute('aria-pressed', hintsOn ? 'true' : 'false');
    }
    refreshHintsButton();

    function nearest(idx){
      let best=999;
      round.treasures.forEach(function(t){best=Math.min(best,distance(idx,t,n));});
      return best;
    }

    function draw(){
      board.innerHTML='';
      found=0;
      foundEl.textContent='0';
      msg.className='th-message';
      msg.textContent='Wybierz pole i szukaj skarbów.';
      const logo=logoSrc();

      round.cells.forEach(function(cell,i){
        const tile=document.createElement('button');
        tile.type='button';
        tile.className='th-tile';
        tile.dataset.idx=String(i);

        if(cell.treasure){
          tile.innerHTML='<div><div class="th-treasure-mark">◆</div><span class="th-treasure-text">SKARB</span></div>';
        }else{
          const rawTask=String(cell.text||'').trim();
          const mathTask=(rawTask.startsWith('\\(') || rawTask.startsWith('\\[') || rawTask.startsWith('$'))
            ? rawTask
            : '\\(' + rawTask + '\\)';
          tile.innerHTML='<div class="th-task">'+mathTask+'</div>';
        }

        const cover=document.createElement('span');
        cover.className='th-cover';
        if(logo){
          const img=document.createElement('img');
          img.src=logo;
          img.alt='';
          cover.appendChild(img);
        }else{
          cover.innerHTML='<strong style="font-size:34px;color:var(--violet)">?</strong>';
        }
        if(data.showNumbers!==false){
          const num=document.createElement('span');
          num.className='th-cover-number';
          num.textContent=String(i+1);
          cover.appendChild(num);
        }
        tile.appendChild(cover);

        tile.addEventListener('click',function(){
          if(!tile.classList.contains('revealed')){
            tile.classList.add('revealed');
            if(cell.treasure){
              tile.classList.add('treasure');
              found++;
              foundEl.textContent=String(found);
              msg.textContent=found>=(data.treasureCount||1) ? 'Wszystkie skarby znalezione!' : 'Skarb znaleziony! Szukaj dalej.';
              if(found>=(data.treasureCount||1)){
                msg.classList.add('win');
                if(typeof confetti==='function') confetti();
              }
            }else{
              if(hintsOn){
                const badge=document.createElement('span');
                badge.className='th-hint';
                badge.textContent=hintLabel(nearest(i));
                tile.appendChild(badge);
                setTimeout(function(){badge.remove();},1500);
              }
              msg.textContent='Rozwiąż odkryte zadanie. Potem wybierz kolejne pole.';
            }
            if(typeof typeset==='function') typeset(tile);
          }else if(!cell.treasure && data.allowCross!==false){
            tile.classList.toggle('crossed');
          }
        });

        board.appendChild(tile);
      });

      if(window.MathJax && MathJax.typesetClear){
        try{ MathJax.typesetClear([board]); }catch(e){}
      }
      if(window.MathJax && MathJax.typesetPromise){
        MathJax.typesetPromise([board]).catch(function(){});
      }else if(typeof typeset==='function'){
        typeset(board);
      }
    }

    if(hintsBtn){
      hintsBtn.addEventListener('click',function(){
        hintsOn=!hintsOn;
        refreshHintsButton();
        container.querySelectorAll('.th-hint').forEach(function(x){x.remove();});
      });
    }
    container.querySelector('.th-reset').addEventListener('click',draw);
    container.querySelector('.th-new').addEventListener('click',function(){
      round=buildRound(data);
      draw();
    });

    draw();
  }

  function hook(){
    ensureUi();

    const oldChange=window.onGameTypeChange;
    if(!window.__thChangeHook){
      window.__thChangeHook=true;
      window.onGameTypeChange=function(){
        if(typeof oldChange==='function') oldChange.apply(this,arguments);
        const active=q('gameType')?.value==='treasure';
        const fields=q('treasureFields');
        if(fields) fields.style.display=active?'block':'none';
        if(active){
          ['matchFields','sortFields','quizFields','memoryFields','puzzleFields','safeFields','flyingFields','trainingFields','fractionModelsFields','connect4Fields']
            .forEach(function(id){const el=q(id);if(el)el.style.display='none';});
          updateCapacity();
        }
      };
    }

    const oldGet=window.getCurrentGameData;
    if(!window.__thGetHook){
      window.__thGetHook=true;
      window.getCurrentGameData=function(){
        if(q('gameType')?.value==='treasure') return treasureData();
        const g=oldGet.apply(this,arguments);
        /* OSTATECZNA NAPRAWA TAGÓW:
           tagi są pobierane w momencie zapisu niezależnie od kolejności wcześniejszych wrapperów. */
        g.classTags=selectedTagsNow();
        g.tags=g.classTags.slice();
        return g;
      };
    }

    const oldRender=window.renderGame;
    if(!window.__thRenderHook){
      window.__thRenderHook=true;
      window.renderGame=function(data,container,isFullscreen){
        if(data && data.type==='treasure'){
          renderTreasure(data,container,isFullscreen);
          return;
        }
        return oldRender.apply(this,arguments);
      };
    }

    const oldLoad=window.loadSavedGame;
    if(!window.__thLoadHook){
      window.__thLoadHook=true;
      window.loadSavedGame=function(index){
        let local=[];
        try{local=JSON.parse(localStorage.getItem('doPotegiGames')||'[]');}catch(e){}
        const possible=local[index];

        if(possible && possible.type==='treasure'){
          q('gameTitle').value=possible.title||'Poszukiwanie skarbów';
          q('gameType').value='treasure';
          setTagsNow(possible.classTags||possible.tags||[]);
          window.onGameTypeChange();
          q('treasureGridSize').value=String(possible.gridSize||5);
          q('treasureCount').value=String(possible.treasureCount||1);
          q('treasureHints').checked=possible.hints!==false;
          q('treasureCross').checked=possible.allowCross!==false;
          q('treasureNumbers').checked=possible.showNumbers!==false;
          q('treasureInput').value=(possible.tasks||[]).join('\n');
          updateCapacity();

          /* Wywołujemy pierwotny loader tylko po to, aby zachować wewnętrzny stan
             „edytowana gra”, po czym przywracamy pola tego trybu. */
          if(typeof oldLoad==='function'){
            try{ oldLoad.apply(this,arguments); }catch(e){}
            q('gameTitle').value=possible.title||'Poszukiwanie skarbów';
            q('gameType').value='treasure';
            setTagsNow(possible.classTags||possible.tags||[]);
            window.onGameTypeChange();
            q('treasureGridSize').value=String(possible.gridSize||5);
            q('treasureCount').value=String(possible.treasureCount||1);
            q('treasureHints').checked=possible.hints!==false;
            q('treasureCross').checked=possible.allowCross!==false;
            q('treasureNumbers').checked=possible.showNumbers!==false;
            q('treasureInput').value=(possible.tasks||[]).join('\n');
            updateCapacity();
          }
          if(typeof showScreen==='function') showScreen('creator');
          if(typeof buildGame==='function') buildGame(false);
          return;
        }

        const result=oldLoad.apply(this,arguments);

        /* NAPRAWA TAGÓW także dla wszystkich starszych typów gier. */
        setTimeout(function(){
          let games=[];
          try{games=JSON.parse(localStorage.getItem('doPotegiGames')||'[]');}catch(e){}
          const game=games[index];
          if(game) setTagsNow(game.classTags||game.tags||[]);
        },0);
        return result;
      };
    }

    const oldSaved=window.renderSavedGames;
    if(!window.__thSavedHook){
      window.__thSavedHook=true;
      window.renderSavedGames=function(){
        const r=oldSaved.apply(this,arguments);
        setTimeout(function(){
          document.querySelectorAll('.saved-game[data-game-type="treasure"] .saved-type-badge')
            .forEach(function(b){b.textContent='Poszukiwanie skarbów';});
        },0);
        return r;
      };
    }

    if(typeof window.onGameTypeChange==='function') window.onGameTypeChange();
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){setTimeout(hook,0);});
  }else{
    setTimeout(hook,0);
  }
})();
