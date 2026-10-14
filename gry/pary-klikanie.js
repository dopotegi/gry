
(function(){
  function finishMatchClick(draggedId, zone, leftStack, rightStack, scoreState, scoreBox, total, clearSelection){
    const dragged = leftStack.querySelector('[data-id="' + CSS.escape(draggedId) + '"]');
    zone.classList.remove('hover');
    if(!dragged || zone.dataset.solved) return;

    if(draggedId === zone.dataset.id){
      zone.dataset.solved = '1';
      dragged.classList.add('good');
      zone.classList.add('good');
      scoreState.value++;
      scoreBox.textContent = scoreState.value + ' / ' + total;

      setTimeout(function(){
        dragged.classList.add('removing');
        zone.classList.add('removing');
      }, 120);

      setTimeout(function(){
        if(dragged.parentNode) dragged.parentNode.removeChild(dragged);
        if(zone.parentNode) zone.parentNode.removeChild(zone);
      }, 360);

      if(typeof clearSelection === 'function') clearSelection();

      if(scoreState.value === total){
        setTimeout(function(){
          showToast('Brawo! Wszystkie pary dopasowane.');
          if(typeof confetti === 'function') confetti();
        }, 380);
      }
    }else{
      zone.classList.add('bad');
      if(dragged) dragged.classList.add('bad');
      setTimeout(function(){
        zone.classList.remove('bad');
        if(dragged) dragged.classList.remove('bad');
      }, 650);
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
      <p class="match-click-hint">Kliknij kartę z lewej strony, a potem pasującą kartę z prawej. Poprawnie dobrana para znika z planszy.</p>
      <div class="match-board compact-match">
        <div>
          <p class="column-title">Karty do dopasowania</p>
          <div class="stack" id="leftStack"></div>
        </div>
        <div>
          <p class="column-title">Odpowiedzi</p>
          <div class="stack" id="rightStack"></div>
        </div>
      </div>
    `;

    container.appendChild(wrapper);
    const leftStack = wrapper.querySelector('#leftStack');
    const rightStack = wrapper.querySelector('#rightStack');
    const scoreBox = wrapper.querySelector('#matchScore');

    function selectCard(card, id){
      if(selectedCard) selectedCard.classList.remove('selected-match');
      selectedId = id;
      selectedCard = card;
      if(selectedCard) selectedCard.classList.add('selected-match');
    }

    function clearSelection(){
      if(selectedCard) selectedCard.classList.remove('selected-match');
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
        if(card.classList.contains('removing')) return;
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
        if(draggedId) finishMatchClick(draggedId, zone, leftStack, rightStack, scoreState, scoreBox, total, clearSelection);
      });
      zone.addEventListener('click', function(){
        if(!selectedId || zone.dataset.solved || zone.classList.contains('removing')) return;
        finishMatchClick(selectedId, zone, leftStack, rightStack, scoreState, scoreBox, total, clearSelection);
      });

      rightStack.appendChild(zone);
    });

    if(typeof typeset === 'function') typeset(wrapper);
  };
})();
