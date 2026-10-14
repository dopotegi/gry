function renderMemoryGame(data, container, isFullscreen) {
    const wrapper = document.createElement('div');
    wrapper.className = isFullscreen ? 'card' : '';
    let matched = 0;
    let first = null;
    let lock = false;
    const cards = [];
    data.pairs.forEach(function(pair) {
      cards.push({ pairId: pair.id, content: pair.left });
      cards.push({ pairId: pair.id, content: pair.right });
    });
    const mixed = shuffle(cards);
    wrapper.innerHTML = `
      <div class="game-head">
        <div><h2>${escapeHtml(data.title)}</h2></div>
        <div class="score" id="memoryScore">0 / ${data.pairs.length}</div>
      </div>
      <div class="memory-grid" id="memoryGrid"></div>
    `;
    container.appendChild(wrapper);
    const grid = wrapper.querySelector('#memoryGrid');
    const scoreBox = wrapper.querySelector('#memoryScore');
    mixed.forEach(function(cardData, index) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'memory-card';
      card.dataset.pairId = cardData.pairId;
      card.dataset.index = index;
      card.innerHTML = `<div class="front">?</div><div class="back">${renderMixed(cardData.content)}</div>`;
      card.addEventListener('click', function() {
        if(lock || card.classList.contains('flipped') || card.classList.contains('matched')) return;
        card.classList.add('flipped');
        if(!first) {
          first = card;
          typeset(card);
          return;
        }
        if(first.dataset.pairId === card.dataset.pairId) {
          first.classList.add('matched');
          card.classList.add('matched');
          matched++;
          scoreBox.textContent = matched + ' / ' + data.pairs.length;
          first = null;
          if(matched === data.pairs.length) {
            showToast('Brawo! Wszystkie pary znalezione.');
            confetti();
          }
        } else {
          lock = true;
          setTimeout(function() {
            first.classList.remove('flipped');
            card.classList.remove('flipped');
            first = null;
            lock = false;
          }, 850);
        }
        typeset(card);
      });
      grid.appendChild(card);
    });
    typeset(wrapper);
  }

