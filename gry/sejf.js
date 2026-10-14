  function renderSafeGame(data, container, isFullscreen) {

    const wrapper = document.createElement('div');
    wrapper.className = isFullscreen ? 'card' : '';

    wrapper.innerHTML = `
      <div class="game-head">
        <div><h2>${escapeHtml(data.title)}</h2></div>
        <div class="score" id="safeScore">0 / ${data.tasks.length}</div>
      </div>

      <div class="safe-layout">
        <div id="safeTasks"></div>

        <div class="safe-side">
          <div class="safe-screen">
            <div>TAJNY KOD</div>
            <div class="safe-code" id="safeCode"></div>
          </div>

          <div class="small" style="text-align:center;">
            Rozwiąż wszystkie zadania, aby odkryć cały kod.
          </div>
        </div>
      </div>
    `;

    container.appendChild(wrapper);

    const tasksBox = wrapper.querySelector('#safeTasks');
    const codeBox = wrapper.querySelector('#safeCode');
    const scoreBox = wrapper.querySelector('#safeScore');

    const digits = [];
    const codeTasks = data.tasks.filter(function(task){ return task.digit !== ''; });
    const codeLength = data.codeLength || codeTasks.length;

    for(let i = 0; i < codeLength; i++){
      const digit = document.createElement('div');
      digit.className = 'safe-digit hidden';
      digit.textContent = codeTasks[i] ? codeTasks[i].digit : '';
      codeBox.appendChild(digit);
      digits.push(digit);
    }

    let solved = 0;
    let revealedDigits = 0;

    data.tasks.forEach(function(task, index){

      const taskEl = document.createElement('div');
      taskEl.className = 'safe-task';

      const hasDigit = task.digit !== '';

      taskEl.innerHTML = `
        <span class="safe-task-meta ${hasDigit ? '' : 'no-code'}">${hasDigit ? 'zadanie z cyfrą kodu' : 'zadanie pomocnicze'}</span>
        <strong>${renderMixed(task.question)}</strong>
        <input class="puzzle-answer math-answer-input" placeholder="Wpisz odpowiedź">
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

            if(task.digit !== '' && digits[revealedDigits]){
              digits[revealedDigits].classList.remove('hidden');
              revealedDigits++;
            }

            solved++;
            scoreBox.textContent = solved + ' / ' + data.tasks.length;

            if(revealedDigits === digits.length){
              showToast('Kod sejfu odkryty!');
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


