
(function(){
  function finishMatchAttempt(draggedId, zone, leftStack, scoreState, scoreBox, total){
    const dragged = leftStack.querySelector('[data-id="' + CSS.escape(draggedId) + '"]');
    zone.classList.remove('hover');
    if(draggedId === zone.dataset.id){
      zone.classList.remove('bad');
      zone.classList.add('good');
      if(dragged) dragged.classList.add('done');
      if(!zone.dataset.solved){
        zone.dataset.solved = '1';
        scoreState.value++;
        scoreBox.textContent = scoreState.value + ' / ' + total;
      }
      if(scoreState.value === total){
        showToast('Brawo! Wszystkie pary dopasowane.');
        if(typeof confetti === 'function') confetti();
      }
    }else{
      zone.classList.add('bad');
      setTimeout(function(){ zone.classList.remove('bad'); },650);
    }
  }

  window.renderMatchGame = function(data, container, isFullscreen){
    const wrapper = document.createElement('div');
    wrapper.className = isFullscreen ? 'card' : '';
    const total = data.pairs.length;
    const shuffledRight = shuffle(data.pairs);
    const scoreState = { value: 0 };
    let selectedId = null;
    let selectedCard = null;

    wrapper.innerHTML = `
      <div class="game-head">
        <div><h2>${escapeHtml(data.title)}</h2></div>
        <div class="score" id="matchScore">0 / ${total}</div>
      </div>
      <p class="match-touch-hint">Na tablecie możesz przeciągać albo kliknąć kartę z lewej strony, a potem właściwe miejsce z prawej.</p>
      <div class="match-board">
        <div>
          <p class="column-title">Karty do dopasowania</p>
          <div class="stack" id="leftStack"></div>
        </div>
        <div>
          <p class="column-title">Miejsca dopasowania</p>
          <div class="stack" id="rightStack"></div>
        </div>
      </div>
    `;

    container.appendChild(wrapper);
    const leftStack = wrapper.querySelector('#leftStack');
    const rightStack = wrapper.querySelector('#rightStack');
    const scoreBox = wrapper.querySelector('#matchScore');

    function selectCard(card, id){
      if(selectedCard) selectedCard.classList.remove('selected-touch');
      selectedId = id;
      selectedCard = card;
      if(selectedCard) selectedCard.classList.add('selected-touch');
    }
    function clearSelection(){
      if(selectedCard) selectedCard.classList.remove('selected-touch');
      selectedId = null;
      selectedCard = null;
    }

    data.pairs.forEach(function(pair){
      const card = document.createElement('div');
      card.className = 'pair-card left';
      card.draggable = true;
      card.innerHTML = renderMixed(pair.left);
      card.dataset.id = pair.id;

      card.addEventListener('dragstart', function(e){
        if(e.dataTransfer){
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', pair.id);
        }
      });

      card.addEventListener('click', function(){
        if(card.classList.contains('done')) return;
        if(selectedId === pair.id) clearSelection();
        else selectCard(card, pair.id);
      });

      leftStack.appendChild(card);
    });

    shuffledRight.forEach(function(pair){
      const zone = document.createElement('div');
      zone.className = 'pair-card drop';
      zone.innerHTML = renderMixed(pair.right);
      zone.dataset.id = pair.id;

      zone.addEventListener('dragover', function(e){
        e.preventDefault();
        zone.classList.add('hover');
      });
      zone.addEventListener('dragleave', function(){ zone.classList.remove('hover'); });
      zone.addEventListener('drop', function(e){
        e.preventDefault();
        const draggedId = e.dataTransfer ? e.dataTransfer.getData('text/plain') : '';
        if(draggedId) finishMatchAttempt(draggedId, zone, leftStack, scoreState, scoreBox, total);
        clearSelection();
      });
      zone.addEventListener('click', function(){
        if(!selectedId || zone.dataset.solved) return;
        finishMatchAttempt(selectedId, zone, leftStack, scoreState, scoreBox, total);
        clearSelection();
      });

      rightStack.appendChild(zone);
    });

    if(typeof typeset === 'function') typeset(wrapper);
  };
})();
