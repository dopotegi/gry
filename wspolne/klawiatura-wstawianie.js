
(function(){
  let lastAnswerInput = null;

  function keyboard(){
    return document.getElementById('mathKeyboard') || document.querySelector('.math-keyboard');
  }

  function showKeyboard(){
    const kb = keyboard();
    if(!kb) return;

    kb.style.display = '';
    kb.style.visibility = 'visible';
    kb.style.opacity = '1';
    kb.style.pointerEvents = 'auto';
    kb.style.transform = '';
  }

  function rememberAnswerInput(el){
    if(el && el.matches && el.matches('.math-answer-input, .training-answer, .puzzle-answer')){
      lastAnswerInput = el;
      window.__doPotegiActiveMathInput = el;
    }
  }

  document.addEventListener('focusin', function(e){
    rememberAnswerInput(e.target);
  }, true);

  document.addEventListener('click', function(e){
    rememberAnswerInput(e.target);
  }, true);

  function forceKeyboardOpenAfterInsert(){
    showKeyboard();

    const input =
      lastAnswerInput ||
      window.__doPotegiActiveMathInput ||
      document.querySelector('.training-answer:not([disabled]), .math-answer-input:not([disabled])');

    if(input){
      window.__doPotegiActiveMathInput = input;
      setTimeout(function(){
        input.focus();
        showKeyboard();
      }, 30);
    }

    setTimeout(showKeyboard, 80);
    setTimeout(showKeyboard, 180);
    setTimeout(showKeyboard, 350);
  }

  function patchInsertButtons(){
    const selectors = [
      '#insertFracBtn',
      '#insertPowerBtn',
      '#insertRootBtn',
      '[data-insert="\\\\frac{}{}"]'
    ];

    selectors.forEach(function(selector){
      document.querySelectorAll(selector).forEach(function(btn){
        if(btn.dataset.v50StayOpen === '1') return;
        btn.dataset.v50StayOpen = '1';

        btn.addEventListener('mousedown', function(e){
          // nie pozwól, żeby kliknięcie zabrało fokus z pola odpowiedzi
          if(btn.id === 'insertFracBtn' || btn.id === 'insertPowerBtn' || btn.id === 'insertRootBtn'){
            e.preventDefault();
          }
        }, true);

        btn.addEventListener('click', function(e){
          // pozwalamy wykonać oryginalne "Wstaw", ale po nim na siłę przywracamy klawiaturę
          setTimeout(forceKeyboardOpenAfterInsert, 0);
          setTimeout(forceKeyboardOpenAfterInsert, 120);
          setTimeout(forceKeyboardOpenAfterInsert, 300);
        }, true);
      });
    });

    // tekstowo łapiemy też przyciski, gdyby miały inne id
    document.querySelectorAll('button').forEach(function(btn){
      const text = (btn.textContent || '').trim().toLowerCase();

      if(!['wstaw', 'wstaw ułamek', 'pusty ułamek'].includes(text)) return;
      if(btn.dataset.v50TextPatched === '1') return;

      btn.dataset.v50TextPatched = '1';

      btn.addEventListener('mousedown', function(e){
        e.preventDefault();
      }, true);

      btn.addEventListener('click', function(){
        setTimeout(forceKeyboardOpenAfterInsert, 0);
        setTimeout(forceKeyboardOpenAfterInsert, 120);
        setTimeout(forceKeyboardOpenAfterInsert, 300);
      }, true);
    });
  }

  document.addEventListener('DOMContentLoaded', patchInsertButtons);

  const observer = new MutationObserver(patchInsertButtons);
  observer.observe(document.body, {childList:true, subtree:true});

  setTimeout(patchInsertButtons, 300);
  setTimeout(patchInsertButtons, 1000);
})();
