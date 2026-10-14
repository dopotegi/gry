
(function(){
  function q(id){ return document.getElementById(id); }

  function uid(prefix){ return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2,8); }

  window.parseSortInput = function(){
    const input = q('sortInput');
    if(!input) throw new Error('Brakuje pola z koszykami.');
    const raw = input.value.trim();
    const categories = raw.split('\n').map(function(line){ return line.trim(); }).filter(Boolean).map(function(line, i){
      const parts = line.split(';').map(function(p){
        return typeof normalizeSlashes === 'function' ? normalizeSlashes(p) : String(p || '').replace(/\\\\/g, '\\').trim();
      }).filter(Boolean);
      if(parts.length < 3) throw new Error('W linijce ' + (i + 1) + ' wpisz nazwę koszyka i przynajmniej dwa elementy.');
      const catId = uid('cat' + i);
      return {
        id: catId,
        name: parts[0],
        items: parts.slice(1).map(function(text, j){
          return { id: uid('item' + i + '_' + j), text: text, categoryId: catId };
        })
      };
    });
    if(categories.length < 2) throw new Error('Dodaj przynajmniej dwa koszyki.');
    const items = [];
    categories.forEach(function(cat){ (cat.items || []).forEach(function(item){ items.push(item); }); });
    if(items.length < 4) throw new Error('Dodaj łącznie przynajmniej cztery elementy do sortowania.');
    return { categories: categories, items: items };
  };

  function attachSortToCurrentGameData(){
    if(window.__sortGetCurrentGameDataAttached) return;
    if(typeof window.getCurrentGameData !== 'function') return;
    window.__sortGetCurrentGameDataAttached = true;
    const original = window.getCurrentGameData;
    window.getCurrentGameData = function(){
      const type = q('gameType') ? q('gameType').value : '';
      if(type === 'sort'){
        const title = q('gameTitle').value.trim() || 'Gra matematyczna';
        const parsed = window.parseSortInput();
        return { type:'sort', title:title, categories:parsed.categories, items:parsed.items };
      }
      return original.apply(this, arguments);
    };
  }

  function attachSortUi(){
    const type = q('gameType');
    if(type && !type.querySelector('option[value="sort"]')){
      const option = document.createElement('option');
      option.value = 'sort';
      option.textContent = 'Sortowanie';
      const quiz = type.querySelector('option[value="quiz"]');
      type.insertBefore(option, quiz || null);
    }

    const creatorCard = document.querySelector('#creator .card');
    if(creatorCard && !q('sortFields')){
      const matchFields = q('matchFields');
      const div = document.createElement('div');
      div.id = 'sortFields';
      div.style.display = 'none';
      div.innerHTML = `
        <label for="sortInput">Koszyki i elementy</label>
        <textarea id="sortInput">Liczby parzyste ; 2 ; 8 ; 14 ; 20
Liczby nieparzyste ; 3 ; 7 ; 11 ; 15
Wielokrotności 5 ; 10 ; 25 ; 35 ; 40</textarea>
        <div class="hint">Jedna kategoria w jednej linijce. Zapis: nazwa koszyka ; element ; element ; element. Możesz używać zapisu matematycznego MathJax.</div>
      `;
      if(matchFields) matchFields.insertAdjacentElement('afterend', div);
    }

    const grid = document.querySelector('#start .game-type-grid');
    if(grid && !q('startSort')){
      const tile = document.createElement('div');
      tile.className = 'game-type';
      tile.id = 'startSort';
      tile.innerHTML = '<div class="icon">🧺</div><h2>Sortowanie</h2><p>Przyporządkuj elementy do odpowiednich kategorii.</p>';
      grid.appendChild(tile);
    }

    const startSort = q('startSort');
    if(startSort && !startSort.dataset.sortListener){
      startSort.dataset.sortListener = '1';
      startSort.addEventListener('click', function(){
        if(typeof selectGameType === 'function') selectGameType('sort');
        else {
          if(type) type.value = 'sort';
          if(typeof onGameTypeChange === 'function') onGameTypeChange();
          if(typeof showScreen === 'function') showScreen('creator');
        }
      });
    }

    if(type && !type.dataset.sortDisplayListener){
      type.dataset.sortDisplayListener = '1';
      type.addEventListener('change', function(){
        const sf = q('sortFields');
        if(sf) sf.style.display = type.value === 'sort' ? 'block' : 'none';
      });
    }
  }

  const previousOnGameTypeChange = window.onGameTypeChange;
  window.onGameTypeChange = function(){
    if(typeof previousOnGameTypeChange === 'function') previousOnGameTypeChange.apply(this, arguments);
    const type = q('gameType') ? q('gameType').value : '';
    const sf = q('sortFields');
    if(sf) sf.style.display = type === 'sort' ? 'block' : 'none';
  };

  function sortTypeInfo(game){
    const itemCount = game.items ? game.items.length : (game.categories || []).reduce(function(sum, cat){ return sum + ((cat.items || []).length); }, 0);
    return { typeLabel:'Sortowanie', count:itemCount + ' elementów' };
  }

  const previousRenderGame = window.renderGame;
  window.renderGame = function(data, container, isFullscreen){
    if(data && data.type === 'sort'){
      container.innerHTML = '';
      window.renderSortGame(data, container, isFullscreen);
      if(typeof typeset === 'function') typeset(container);
      return;
    }
    return previousRenderGame.apply(this, arguments);
  };

  window.renderSortGame = function(data, container, isFullscreen){
    const categories = data.categories || [];
    const items = (data.items && data.items.length ? data.items : categories.flatMap(function(cat){
      return (cat.items || []).map(function(item){
        return typeof item === 'string' ? { id:uid('item'), text:item, categoryId:cat.id } : item;
      });
    })).slice();
    const total = items.length;
    const wrapper = document.createElement('div');
    wrapper.className = isFullscreen ? 'card' : '';
    let solved = 0;
    let selectedItem = null;
    let selectedEl = null;

    wrapper.innerHTML = `
      <div class="game-head">
        <div><h2>${escapeHtml(data.title || 'Sortowanie')}</h2></div>
        <div class="score" id="sortScore">0 / ${total}</div>
      </div>
      <p class="sort-hint">Kliknij element, a potem właściwą kategorię. Możesz też przeciągać elementy do odpowiednich pól.</p>
      <div class="sort-layout">
        <div class="sort-baskets" id="sortBaskets"></div>
        <div class="sort-items-bank">
          <h3>Elementy do posortowania</h3>
          <div class="sort-items-list" id="sortItemsList"></div>
        </div>
      </div>
    `;
    container.appendChild(wrapper);

    const basketsBox = wrapper.querySelector('#sortBaskets');
    const itemsBox = wrapper.querySelector('#sortItemsList');
    const scoreBox = wrapper.querySelector('#sortScore');

    function clearSelection(){
      if(selectedEl) selectedEl.classList.remove('selected-sort');
      selectedItem = null;
      selectedEl = null;
    }

    function placeItem(item, itemEl, basket){
      if(!item || !itemEl || !basket || itemEl.dataset.placed) return;
      if(item.categoryId === basket.dataset.categoryId){
        itemEl.dataset.placed = '1';
        itemEl.classList.remove('selected-sort', 'bad');
        itemEl.classList.add('good', 'placed');
        basket.querySelector('.sort-basket-items').appendChild(itemEl);
        solved++;
        scoreBox.textContent = solved + ' / ' + total;
        clearSelection();
        if(solved === total){
          showToast('Brawo! Wszystkie elementy są w dobrych koszykach.');
          if(typeof confetti === 'function') confetti();
        }
      }else{
        itemEl.classList.add('bad');
        basket.classList.add('selected-basket');
        setTimeout(function(){
          itemEl.classList.remove('bad');
          basket.classList.remove('selected-basket');
        }, 650);
      }
    }

    categories.forEach(function(cat){
      const basket = document.createElement('div');
      basket.className = 'sort-basket';
      basket.dataset.categoryId = cat.id;
      basket.innerHTML = '<h3>' + renderMixed(cat.name) + '</h3><div class="sort-basket-items"></div>';
      basket.addEventListener('dragover', function(e){ e.preventDefault(); basket.classList.add('hover'); });
      basket.addEventListener('dragleave', function(){ basket.classList.remove('hover'); });
      basket.addEventListener('drop', function(e){
        e.preventDefault();
        basket.classList.remove('hover');
        const itemId = e.dataTransfer ? e.dataTransfer.getData('text/plain') : '';
        const itemEl = wrapper.querySelector('[data-sort-item-id="' + CSS.escape(itemId) + '"]');
        const item = items.find(function(x){ return x.id === itemId; });
        placeItem(item, itemEl, basket);
      });
      basket.addEventListener('click', function(){
        if(selectedItem && selectedEl) placeItem(selectedItem, selectedEl, basket);
      });
      basketsBox.appendChild(basket);
    });

    shuffle(items).forEach(function(item){
      const el = document.createElement('div');
      el.className = 'sort-item';
      el.draggable = true;
      el.dataset.sortItemId = item.id;
      el.innerHTML = renderMixed(item.text);
      el.addEventListener('dragstart', function(e){
        if(e.dataTransfer){
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', item.id);
        }
      });
      el.addEventListener('click', function(){
        if(el.dataset.placed) return;
        if(selectedEl === el) clearSelection();
        else{
          clearSelection();
          selectedItem = item;
          selectedEl = el;
          el.classList.add('selected-sort');
        }
      });
      itemsBox.appendChild(el);
    });
  };

  // Edycja zapisanej gry sortowania — nadpisujemy loader, ale dla innych typów zostawiamy poprzednie działanie.
  const previousLoadSavedGame = window.loadSavedGame;
  window.loadSavedGame = function(index){
    const list = (typeof currentSavedGames === 'function') ? currentSavedGames() : JSON.parse(localStorage.getItem('doPotegiGames') || '[]');
    const game = list[index];
    if(!game || game.type !== 'sort') return previousLoadSavedGame.apply(this, arguments);

    if(typeof markGameAsEdited === 'function') markGameAsEdited(game, index);
    q('gameTitle').value = game.title || 'Gra matematyczna';
    q('gameType').value = 'sort';
    if(typeof setSelectedClassTags === 'function') setSelectedClassTags(game.classTags || game.tags || []);
    if(typeof window.onGameTypeChange === 'function') window.onGameTypeChange();
    if(q('sortInput')){
      q('sortInput').value = (game.categories || []).map(function(cat){
        return [cat.name].concat((cat.items || []).map(function(item){ return item.text || item; })).join(' ; ');
      }).join('\n');
    }
    showScreen('creator');
    buildGame(false);
  };

  // Po filtrach dodajemy typ sortowania, jeśli panel już istnieje.
  function addSortFilterButton(){
    const panel = q('savedFilterPanel');
    if(panel && !panel.querySelector('[data-filter="sort"]')){
      const matchBtn = panel.querySelector('[data-filter="match"]');
      const btn = document.createElement('button');
      btn.className = 'saved-filter-button';
      btn.type = 'button';
      btn.dataset.filter = 'sort';
      btn.textContent = 'Sortowanie';
      if(matchBtn) matchBtn.insertAdjacentElement('afterend', btn);
    }
  }

  const previousRenderSavedGames = window.renderSavedGames;
  window.renderSavedGames = function(){
    const result = previousRenderSavedGames.apply(this, arguments);
    addSortFilterButton();
    document.querySelectorAll('.saved-game[data-game-type="sort"] .saved-type-badge').forEach(function(badge){
      badge.textContent = 'Sortowanie';
    });
    return result;
  };

  document.addEventListener('DOMContentLoaded', function(){
    attachSortUi();
    attachSortToCurrentGameData();
    window.onGameTypeChange();
  });
})();
