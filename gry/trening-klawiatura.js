
(function(){
  function keyboard(){
    return document.getElementById('mathKeyboard') || document.querySelector('.math-keyboard');
  }

  function isFullscreenOpen(){
    const full = document.getElementById('fullscreen') || document.querySelector('.fullscreen-overlay, .fullscreen-game');
    if(!full) return false;
    const style = window.getComputedStyle(full);
    return style.display !== 'none' && style.visibility !== 'hidden' && full.offsetParent !== null;
  }

  function showKeyboard(){
    const kb = keyboard();
    if(!kb) return;
    if(!isFullscreenOpen()){
      kb.classList.add('creator-hidden');
      kb.style.display = 'none';
      return;
    }
    document.body.classList.add('game-fullscreen-active');
    kb.classList.remove('creator-hidden');
    kb.style.display = '';
    kb.style.opacity = '';
    kb.style.pointerEvents = '';
    kb.style.transform = '';
  }

  function hideKeyboard(){
    const kb = keyboard();
    if(!kb) return;
    kb.style.display = 'none';
    kb.style.opacity = '';
    kb.style.pointerEvents = '';
    kb.style.transform = '';
  }

  document.addEventListener('focusin', function(e){
    const el = e.target;
    if(el && el.matches && el.matches('.math-answer-input, .puzzle-answer, .training-answer')){
      window.__doPotegiActiveMathInput = el;
      if(isFullscreenOpen()) showKeyboard();
      else hideKeyboard();
    }
  }, true);

  window.renderTrainingGame = function(data, container, isFullscreen){
    const wrapper = document.createElement("div");
    wrapper.className = isFullscreen ? "card" : "";
    let index = 0;
    let waiting = false;

    wrapper.innerHTML = `
      <div class="game-head">
        <div><h2>${escapeHtml(data.title)}</h2></div>
        <div class="score" id="trainingScore">1 / ${data.tasks.length}</div>
      </div>
      <div class="training-card">
        <div class="training-example" id="trainingExample"></div>
        <input class="training-answer math-answer-input" id="trainingAnswer" placeholder="Wpisz odpowiedź" autocomplete="off">
        <div class="training-feedback" id="trainingFeedback"></div>
        <div class="training-actions" style="display:none">
          <button class="btn" type="button" id="trainingCheck">Sprawdź</button>
          <button class="btn secondary" type="button" id="trainingNext">Dalej</button>
        </div>
      </div>
    `;

    container.appendChild(wrapper);

    const exampleBox = wrapper.querySelector("#trainingExample");
    const answerInput = wrapper.querySelector("#trainingAnswer");
    const feedback = wrapper.querySelector("#trainingFeedback");
    const scoreBox = wrapper.querySelector("#trainingScore");

    function activateInput(){
      window.__doPotegiActiveMathInput = answerInput;
      setTimeout(function(){
        answerInput.focus();
        if(isFullscreen || isFullscreenOpen()) showKeyboard();
        else hideKeyboard();
      }, 80);
    }

    function draw(){
      waiting = false;
      const task = data.tasks[index];
      exampleBox.innerHTML = renderMixed(task.question);
      answerInput.value = "";
      answerInput.disabled = false;
      feedback.textContent = "";
      feedback.className = "training-feedback";
      scoreBox.textContent = (index + 1) + " / " + data.tasks.length;
      if(typeof typeset === "function") typeset(wrapper);
      activateInput();
    }

    function finish(){
      hideKeyboard();
      document.body.classList.remove('game-fullscreen-active');
      wrapper.innerHTML = `
        <div class="training-card">
          <h2>Koniec treningu</h2>
          <p>Przykłady zakończone.</p>
          <button class="btn" type="button" id="trainingAgain">Zacznij od nowa</button>
        </div>
      `;
      wrapper.querySelector("#trainingAgain").onclick = function(){
        container.innerHTML = "";
        window.renderTrainingGame(data, container, isFullscreen);
      };
      if(typeof confetti === "function") confetti();
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
      if(waiting) return;
      const task = data.tasks[index];
      const value = normalizeMathAnswer(answerInput.value);
      const answer = normalizeMathAnswer(task.answer);
      if(value === answer){
        waiting = true;
        feedback.textContent = "Dobrze!";
        feedback.className = "training-feedback good";
        answerInput.disabled = true;
        setTimeout(goNext, 350);
      }else{
        feedback.textContent = "Spróbuj jeszcze raz.";
        feedback.className = "training-feedback bad";
        activateInput();
      }
    }

    answerInput.addEventListener("keydown", function(e){
      if(e.key === "Enter"){
        e.preventDefault();
        check();
      }
    });

    draw();
  };

  function patchEnter(){
    const btn = document.getElementById('mathKeyboardEnterBtn');
    if(!btn || btn.dataset.v47 === '1') return;
    btn.dataset.v47 = '1';

    btn.addEventListener('mousedown', function(e){ e.preventDefault(); }, true);
    btn.addEventListener('click', function(e){
      const input = window.__doPotegiActiveMathInput || document.querySelector('.training-answer:not([disabled]), .math-answer-input:not([disabled])');
      if(!input) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      input.focus();
      input.dispatchEvent(new KeyboardEvent('keydown', {
        key:'Enter', code:'Enter', keyCode:13, which:13, bubbles:true, cancelable:true
      }));
    }, true);
  }

  const oldClose = window.closeFullscreen;
  if(typeof oldClose === 'function' && !oldClose.__v47patched){
    const patched = function(){
      hideKeyboard();
      document.body.classList.remove('game-fullscreen-active');
      return oldClose.apply(this, arguments);
    };
    patched.__v47patched = true;
    window.closeFullscreen = patched;
  }

  document.addEventListener('DOMContentLoaded', function(){
    hideKeyboard();
    patchEnter();
  });
  setTimeout(function(){ hideKeyboard(); patchEnter(); }, 400);
  setTimeout(patchEnter, 1200);
  const observer = new MutationObserver(patchEnter);
  observer.observe(document.body, {childList:true, subtree:true});
})();
