
  function renderMatchGame(data, container, isFullscreen) {
    const wrapper = document.createElement('div');
    wrapper.className = isFullscreen ? 'card' : '';

    let score = 0;
    const total = data.pairs.length;
    const shuffledRight = shuffle(data.pairs);

    wrapper.innerHTML = `
      <div class="game-head">
        <div><h2>${escapeHtml(data.title)}</h2></div>
        <div class="score" id="matchScore">0 / ${total}</div>
      </div>
      <div class="match-board">
        <div>
          <p class="column-title">Karty do przeciągnięcia</p>
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

    data.pairs.forEach(function(pair) {
      const card = document.createElement('div');
      card.className = 'pair-card left';
      card.draggable = true;
      card.innerHTML = renderMixed(pair.left);
      card.dataset.id = pair.id;

      card.addEventListener('dragstart', function(e) {
        e.dataTransfer.setData('text/plain', pair.id);
      });

      leftStack.appendChild(card);
    });

    shuffledRight.forEach(function(pair) {
      const zone = document.createElement('div');
      zone.className = 'pair-card drop';
      zone.innerHTML = renderMixed(pair.right);
      zone.dataset.id = pair.id;

      zone.addEventListener('dragover', function(e) {
        e.preventDefault();
        zone.classList.add('hover');
      });

      zone.addEventListener('dragleave', function() { zone.classList.remove('hover'); });

      zone.addEventListener('drop', function(e) {
        e.preventDefault();
        zone.classList.remove('hover');
        const draggedId = e.dataTransfer.getData('text/plain');
        const dragged = leftStack.querySelector(`[data-id="${draggedId}"]`);

        if(draggedId === zone.dataset.id) {
          zone.classList.remove('bad');
          zone.classList.add('good');
          if(dragged) dragged.classList.add('done');
          score++;
          scoreBox.textContent = score + ' / ' + total;
          if(score === total) {
            showToast('Brawo! Wszystkie pary dopasowane.');
            confetti();
          }
        } else {
          zone.classList.add('bad');
          setTimeout(function() { zone.classList.remove('bad'); }, 650);
        }
      });

      rightStack.appendChild(zone);
    });

    typeset(wrapper);
  }


  
  
