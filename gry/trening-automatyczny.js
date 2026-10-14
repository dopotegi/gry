
(function(){
  function kb(){
    return document.getElementById('mathKeyboard') || document.querySelector('.math-keyboard');
  }

  function isFull(){
    const f = document.getElementById('fullscreen') || document.querySelector('.fullscreen-overlay, .fullscreen-game');
    if(!f) return false;
    const s = getComputedStyle(f);
    return s.display !== 'none' && s.visibility !== 'hidden';
  }

  function showKb(){
    const k = kb();
    if(!k) return;
    k.style.display = '';
    k.style.opacity = '';
    k.style.pointerEvents = '';
    k.style.transform = '';
  }

  function hideKb(){
    const k = kb();
    if(!k) return;
    k.style.display = 'none';
  }

  function nextUnansweredTrainingInput(){
    return document.querySelector('.training-answer:not([disabled])');
  }

  function renderTrainingAuto(data, container, isFullscreen){
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = isFullscreen ? 'card' : '';

    let index = 0;
    let locked = false;

    wrapper.innerHTML = `
      <div class="game-head">
        <div><h2>${escapeHtml(data.title)}</h2></div>
        <div class="score" id="trainingScore">1 / ${data.tasks.length}</div>
      </div>
      <div class="training-card">
        <div class="training-example" id="trainingExample"></div>
        <input class="training-answer math-answer-input" id="trainingAnswer" placeholder="Wpisz odpowiedź" autocomplete="off">
        <div class="training-feedback" id="trainingFeedback"></div>
      </div>
    `;

    container.appendChild(wrapper);

    const exampleBox = wrapper.querySelector('#trainingExample');
    const answerInput = wrapper.querySelector('#trainingAnswer');
    const feedback = wrapper.querySelector('#trainingFeedback');
    const scoreBox = wrapper.querySelector('#trainingScore');

    function activate(){
      window.__doPotegiActiveMathInput = answerInput;
      setTimeout(function(){
        answerInput.focus();
        if(isFullscreen || isFull()) showKb();
      }, 80);
    }

    function draw(){
      locked = false;
      const task = data.tasks[index];

      exampleBox.innerHTML = renderMixed(task.question);
      answerInput.value = '';
      answerInput.disabled = false;
      feedback.textContent = '';
      feedback.className = 'training-feedback';
      scoreBox.textContent = (index + 1) + ' / ' + data.tasks.length;

      if(typeof typeset === 'function') typeset(wrapper);
      activate();
    }

    function finish(){
      hideKb();
      wrapper.innerHTML = `
        <div class="training-card">
          <h2>Koniec treningu</h2>
          <p>Przykłady zakończone.</p>
          <button class="btn" type="button" id="trainingAgain">Zacznij od nowa</button>
        </div>
      `;
      wrapper.querySelector('#trainingAgain').onclick = function(){
        renderTrainingAuto(data, container, isFullscreen);
      };
      if(typeof confetti === 'function') confetti();
    }

    function goNext(){
      if(index < data.tasks.length - 1){
        index++;
        draw();
      }else{
        finish();
      }
    }

    function check(){
      if(locked) return;

      const task = data.tasks[index];
      const value = normalizeMathAnswer(answerInput.value);
      const answer = normalizeMathAnswer(task.answer);

      if(value === answer){
        locked = true;
        feedback.textContent = 'Dobrze!';
        feedback.className = 'training-feedback good';
        answerInput.disabled = true;

        // ważne: przejście zawsze wymuszone tutaj
        setTimeout(goNext, 500);
      }else{
        feedback.textContent = 'Spróbuj jeszcze raz.';
        feedback.className = 'training-feedback bad';
        activate();
      }
    }

    answerInput.addEventListener('keydown', function(e){
      if(e.key === 'Enter'){
        e.preventDefault();
        e.stopImmediatePropagation();
        check();
      }
    }, true);

    draw();
  }

  window.renderTrainingGame = renderTrainingAuto;

  // Najważniejsze: nadpisujemy renderGame, bo starsza wersja mogła używać lokalnej funkcji renderTrainingGame.
  const oldRenderGame = window.renderGame;
  window.renderGame = function(data, container, isFullscreen){
    if(data && data.type === 'training'){
      renderTrainingAuto(data, container, isFullscreen);
      return;
    }
    return oldRenderGame(data, container, isFullscreen);
  };

  // Jeżeli fullscreen uruchamia starą funkcję bezpośrednio, wymuszamy odświeżenie po wejściu.
  const oldOpenFullscreen = window.openFullscreen;
  if(typeof oldOpenFullscreen === 'function' && !oldOpenFullscreen.__trainingV48){
    const patched = function(data){
      const result = oldOpenFullscreen.apply(this, arguments);
      if(data && data.type === 'training'){
        setTimeout(function(){
          const box = document.getElementById('fullscreenGame') || document.getElementById('fullscreenContent') || document.querySelector('.fullscreen-game .game-area, .fullscreen-overlay .game-area, #fullscreen .game-area');
          if(box) renderTrainingAuto(data, box, true);
        }, 80);
      }
      return result;
    };
    patched.__trainingV48 = true;
    window.openFullscreen = patched;
  }

  // Zatwierdź na klawiaturze: niech nie uruchamia starej logiki, tylko keydown Enter w aktywnym polu treningu.
  function patchKeyboardEnter(){
    const btn = document.getElementById('mathKeyboardEnterBtn');
    if(!btn || btn.dataset.v48 === '1') return;
    btn.dataset.v48 = '1';

    btn.addEventListener('mousedown', function(e){
      e.preventDefault();
    }, true);

    btn.addEventListener('click', function(e){
      const input = window.__doPotegiActiveMathInput || nextUnansweredTrainingInput();
      if(input && input.classList.contains('training-answer')){
        e.preventDefault();
        e.stopImmediatePropagation();

        input.focus();
        input.dispatchEvent(new KeyboardEvent('keydown', {
          key:'Enter',
          code:'Enter',
          keyCode:13,
          which:13,
          bubbles:true,
          cancelable:true
        }));
      }
    }, true);
  }

  document.addEventListener('DOMContentLoaded', patchKeyboardEnter);
  setTimeout(patchKeyboardEnter, 300);
  setTimeout(patchKeyboardEnter, 1000);

  const observer = new MutationObserver(patchKeyboardEnter);
  observer.observe(document.body, {childList:true, subtree:true});
})();
