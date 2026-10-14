
(function(){
  function showKeyboard(){
    const keyboard = document.getElementById('mathKeyboard') || document.querySelector('.math-keyboard');
    if(!keyboard) return;
    keyboard.style.display = '';
    keyboard.style.opacity = '';
    keyboard.style.pointerEvents = '';
    keyboard.style.transform = '';
  }

  function hideKeyboard(){
    const keyboard = document.getElementById('mathKeyboard') || document.querySelector('.math-keyboard');
    if(!keyboard) return;
    keyboard.style.opacity = '0';
    keyboard.style.pointerEvents = 'none';
    keyboard.style.transform = 'translateY(12px)';
    setTimeout(function(){
      keyboard.style.display = 'none';
    }, 140);
  }

  function setActiveInput(input){
    if(!input) return;
    window.__doPotegiActiveMathInput = input;
    setTimeout(function(){
      input.focus();
      showKeyboard();
    }, 80);
  }

  window.renderTrainingGame = function(data, container, isFullscreen){
    const wrapper = document.createElement("div");
    wrapper.className = isFullscreen ? "card" : "";

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
        <div class="training-actions">
          <button class="btn" type="button" id="trainingCheck">Sprawdź</button>
          <button class="btn secondary" type="button" id="trainingNext">Dalej</button>
        </div>
      </div>
    `;

    container.appendChild(wrapper);

    const exampleBox = wrapper.querySelector("#trainingExample");
    const answerInput = wrapper.querySelector("#trainingAnswer");
    const feedback = wrapper.querySelector("#trainingFeedback");
    const checkBtn = wrapper.querySelector("#trainingCheck");
    const nextBtn = wrapper.querySelector("#trainingNext");
    const scoreBox = wrapper.querySelector("#trainingScore");

    function draw(){
      locked = false;
      const task = data.tasks[index];

      exampleBox.innerHTML = renderMixed(task.question);
      answerInput.value = "";
      answerInput.disabled = false;
      feedback.textContent = "";
      feedback.className = "training-feedback";
      scoreBox.textContent = (index + 1) + " / " + data.tasks.length;

      // W trybie trening "Dalej" zostaje jako awaryjny przycisk,
      // ale po dobrej odpowiedzi przejście dzieje się automatycznie.
      nextBtn.disabled = false;

      if(typeof typeset === "function") typeset(wrapper);
      setActiveInput(answerInput);
    }

    function finish(){
      hideKeyboard();

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
      if(locked) return;

      const task = data.tasks[index];
      const value = normalizeMathAnswer(answerInput.value);
      const answer = normalizeMathAnswer(task.answer);

      if(value === answer){
        locked = true;
        feedback.textContent = "Dobrze!";
        feedback.className = "training-feedback good";
        answerInput.disabled = true;

        setTimeout(function(){
          goNext();
        }, 450);

      }else{
        feedback.textContent = "Spróbuj jeszcze raz.";
        feedback.className = "training-feedback bad";
        setActiveInput(answerInput);
      }
    }

    checkBtn.onclick = check;
    nextBtn.onclick = goNext;

    answerInput.addEventListener("keydown", function(e){
      if(e.key === "Enter"){
        e.preventDefault();
        check();
      }
    });

    draw();
  };

  // Upewniamy się, że Zatwierdź z klawiatury wywołuje Enter na aktywnym polu
  function patchEnterButton(){
    const btn = document.getElementById('mathKeyboardEnterBtn');
    if(!btn || btn.dataset.trainingAutoNextPatch === '1') return;

    btn.dataset.trainingAutoNextPatch = '1';

    btn.addEventListener('mousedown', function(e){
      e.preventDefault();
    }, true);

    btn.addEventListener('click', function(e){
      const input = window.__doPotegiActiveMathInput || document.querySelector('.training-answer:not([disabled])');

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

  document.addEventListener('DOMContentLoaded', patchEnterButton);
  setTimeout(patchEnterButton, 300);
  setTimeout(patchEnterButton, 1000);

  const observer = new MutationObserver(patchEnterButton);
  observer.observe(document.body, {childList:true, subtree:true});
})();
