function renderPuzzleGame(data, container, isFullscreen) {

    const wrapper = document.createElement('div');
    wrapper.className = isFullscreen ? 'card' : '';

    wrapper.innerHTML = `
      <div class="game-head">
        <div><h2>${escapeHtml(data.title)}</h2></div>
        <div class="score" id="puzzleScore">0 / ${data.tasks.length}</div>
      </div>

      <div class="puzzle-layout">
        <div class="puzzle-side" id="puzzleTasks"></div>

        <div class="puzzle-image" id="puzzleImageBox">
          <img src="${data.image}" alt="Puzzle">
        </div>
      </div>
    `;

    container.appendChild(wrapper);

    const tasksBox = wrapper.querySelector('#puzzleTasks');
    const imageBox = wrapper.querySelector('#puzzleImageBox');
    const scoreBox = wrapper.querySelector('#puzzleScore');

    const covers = [];

    const size = Math.ceil(Math.sqrt(data.tasks.length));

    for(let row=0; row<size; row++){
      for(let col=0; col<size; col++){

        const cover = document.createElement('div');
        cover.className = 'puzzle-cover';

        cover.style.left = (100/size)*col + '%';
        cover.style.top = (100/size)*row + '%';
        cover.style.width = (100/size) + '%';
        cover.style.height = (100/size) + '%';

        imageBox.appendChild(cover);
        covers.push(cover);

      }
    }

    let solved = 0;

    data.tasks.forEach(function(task, index){

      const taskEl = document.createElement('div');
      taskEl.className = 'puzzle-task';

      taskEl.innerHTML = `
        <strong>${renderMixed(task.question)}</strong>
        <input class="puzzle-answer math-answer-input" placeholder="Wpisz odpowiedź" autocomplete="off">
      `;

      const input = taskEl.querySelector('input');

      input.addEventListener('keydown', function(e){

        if(e.key === 'Enter'){

          const value = normalizeMathAnswer(input.value);

          const answer = normalizeMathAnswer(task.answer);

          if(value === answer){

            taskEl.style.borderColor = 'var(--green)';
            taskEl.style.background = '#effaf5';

            input.disabled = true;

            if(covers[index]){
              covers[index].classList.add('hidden');
            }

            solved++;

            scoreBox.textContent = solved + ' / ' + data.tasks.length;

            if(solved === data.tasks.length){
              showToast('Brawo! Odkryto cały obrazek.');
              confetti();
            }

          } else {

            taskEl.style.borderColor = 'var(--red)';
            taskEl.style.background = '#fff1f1';

            setTimeout(function(){
              taskEl.style.borderColor = 'var(--line)';
              taskEl.style.background = '#fff';
            }, 700);

          }

        }

      });

      tasksBox.appendChild(taskEl);

    });

    typeset(wrapper);

  }


