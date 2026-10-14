  function renderQuizGame(data, container, isFullscreen) {
    let index = 0;
    let score = 0;
    const wrapper = document.createElement('div');
    wrapper.className = isFullscreen ? 'card' : '';
    container.appendChild(wrapper);

    function drawQuestion() {
      const q = data.questions[index];

      wrapper.innerHTML = `
        <div class="game-head">
          <div><h2>${escapeHtml(data.title)}</h2></div>
          <div class="score">${index + 1} / ${data.questions.length} | wynik: ${score}</div>
        </div>
        <div class="quiz-card">
          <div class="quiz-question">${renderMixed(q.question)}</div>
          <div class="answers"></div>
        </div>
      `;

      const answersBox = wrapper.querySelector('.answers');

      q.answers.forEach(function(answer) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'answer-btn';
        btn.innerHTML = renderMixed(answer);

        btn.addEventListener('click', function() {
          const all = answersBox.querySelectorAll('button');
          all.forEach(function(b) { b.disabled = true; });

          if(answer === q.correct) {
            btn.classList.add('good');
            score++;
          } else {
            btn.classList.add('bad');
            all.forEach(function(b) {
              if(b.dataset.raw === q.correct) b.classList.add('good');
            });
          }

          setTimeout(function() {
            index++;
            if(index < data.questions.length) {
              drawQuestion();
            } else {
              wrapper.innerHTML = `
                <div class="quiz-card">
                  <h2>Koniec gry</h2>
                  <p>Wynik: <strong>${score} / ${data.questions.length}</strong></p>
                  <button class="btn" type="button" id="againQuiz">Zagraj ponownie</button>
                </div>
              `;
              wrapper.querySelector('#againQuiz').addEventListener('click', function() {
                renderGame(data, container, isFullscreen);
              });
              if(score === data.questions.length) confetti();
            }
            typeset(wrapper);
          }, 850);
        });

        btn.dataset.raw = answer;
        answersBox.appendChild(btn);
      });

      typeset(wrapper);
    }

    drawQuestion();
  }

