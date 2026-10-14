
(function(){

  function getKeyboard(){
    return document.getElementById('mathKeyboard')
      || document.querySelector('.math-keyboard');
  }

  function forceOpen(){
    const kb = getKeyboard();
    if(!kb) return;

    kb.style.display = 'block';
    kb.style.visibility = 'visible';
    kb.style.opacity = '1';
    kb.style.pointerEvents = 'auto';
  }

  document.addEventListener('click', function(e){

    const btn = e.target.closest('button');
    if(!btn) return;

    const text = (btn.textContent || '').trim().toLowerCase();

    if(
      text === 'wstaw'
      || text === 'wstaw ułamek'
      || text === 'pusty ułamek'
    ){

      setTimeout(forceOpen, 0);
      setTimeout(forceOpen, 60);
      setTimeout(forceOpen, 180);
      setTimeout(forceOpen, 350);

      setTimeout(function(){
        const input =
          window.__doPotegiActiveMathInput
          || document.querySelector('.training-answer:not([disabled])')
          || document.querySelector('.math-answer-input:not([disabled])');

        if(input){
          input.focus();
        }
      }, 70);
    }

  }, true);

})();
