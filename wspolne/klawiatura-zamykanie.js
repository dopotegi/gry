
(function(){

  // blokujemy automatyczne zamykanie po kliknięciu "Wstaw"
  function patchInsertButtons(){
    const buttons = [...document.querySelectorAll('button')];

    buttons.forEach(btn=>{
      const txt = (btn.textContent || '').trim().toLowerCase();

      if((txt === 'wstaw' || txt === 'wstaw ułamek' || txt === 'pusty ułamek') && !btn.dataset.v49patched){

        btn.dataset.v49patched = '1';

        btn.addEventListener('click', function(){
          setTimeout(function(){

            const kb =
              document.getElementById('mathKeyboard') ||
              document.querySelector('.math-keyboard');

            if(kb){
              kb.style.display = '';
              kb.style.visibility = 'visible';
              kb.style.opacity = '1';
              kb.style.pointerEvents = 'auto';
            }

            const input =
              window.__doPotegiActiveMathInput ||
              document.querySelector('.training-answer:not([disabled])') ||
              document.querySelector('.math-answer-input');

            if(input){
              input.focus();
            }

          }, 10);
        }, true);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', patchInsertButtons);

  const observer = new MutationObserver(patchInsertButtons);
  observer.observe(document.body, {
    childList:true,
    subtree:true
  });

})();
