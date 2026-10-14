
(function(){
  let activeTarget = null;
  let activeAnswerInput = null;

  function kb(){
    return document.getElementById('mathKeyboard') || document.querySelector('.math-keyboard');
  }

  function isAnswerInput(el){
    return el && el.matches && el.matches('.math-answer-input, .puzzle-answer, .training-answer');
  }

  function isBuilderInput(el){
    return el && [
      'fracNum','fracDen',
      'powerBaseInput','powerExpInput',
      'rootDegInput','rootValInput'
    ].includes(el.id);
  }

  function remember(el){
    if(isAnswerInput(el)){
      activeTarget = el;
      activeAnswerInput = el;
      window.__doPotegiActiveMathInput = el;
      showKeyboard();
    }else if(isBuilderInput(el)){
      activeTarget = el;
    }
  }

  function showKeyboard(){
    const keyboard = kb();
    if(!keyboard) return;
    keyboard.style.display = '';
    keyboard.style.opacity = '';
    keyboard.style.pointerEvents = '';
    keyboard.style.transform = '';
  }

  function hideKeyboard(){
    const keyboard = kb();
    if(!keyboard) return;
    keyboard.style.opacity = '0';
    keyboard.style.pointerEvents = 'none';
    keyboard.style.transform = 'translateY(12px)';
    setTimeout(function(){
      keyboard.style.display = 'none';
    }, 140);
  }

  function insertAt(target, text, cursorOffset){
    if(!target) return;

    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? target.value.length;
    const value = target.value || '';

    target.value = value.slice(0,start) + text + value.slice(end);

    const pos = start + text.length + Number(cursorOffset || 0);
    target.focus();
    target.setSelectionRange(pos, pos);
  }

  function eraseAt(target){
    if(!target) return;

    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? target.value.length;
    const value = target.value || '';

    if(start !== end){
      target.value = value.slice(0,start) + value.slice(end);
      target.setSelectionRange(start,start);
    }else if(start > 0){
      target.value = value.slice(0,start-1) + value.slice(start);
      target.setSelectionRange(start-1,start-1);
    }

    target.focus();
  }

  function ensureBuilders(){
    const keyboard = kb();
    if(!keyboard) return;

    const fracMaker = keyboard.querySelector('.frac-maker') || keyboard;

    if(!document.getElementById('mathKeyboardEnterBtn')){
      const enter = document.createElement('button');
      enter.id = 'mathKeyboardEnterBtn';
      enter.type = 'button';
      enter.className = 'btn small keyboard-enter-btn';
      enter.textContent = 'Zatwierdź';
      fracMaker.appendChild(enter);
    }

    if(!document.getElementById('powerBaseInput')){
      const power = document.createElement('div');
      power.className = 'power-builder';
      power.innerHTML = `
        <span style="font-weight:700;color:var(--violet)">Potęga:</span>
        <input type="text" id="powerBaseInput" placeholder="podstawa">
        <span>^</span>
        <input type="text" id="powerExpInput" placeholder="wykł.">
        <button type="button" class="btn small builder-insert-btn" id="insertPowerBtn">Wstaw</button>
      `;
      keyboard.appendChild(power);
    }

    if(!document.getElementById('rootValInput')){
      const root = document.createElement('div');
      root.className = 'root-builder';
      root.innerHTML = `
        <span style="font-weight:700;color:var(--violet)">Pierwiastek:</span>
        <input type="text" id="rootDegInput" placeholder="stopień">
        <span>√</span>
        <input type="text" id="rootValInput" placeholder="liczba">
        <button type="button" class="btn small builder-insert-btn" id="insertRootBtn">Wstaw</button>
      `;
      keyboard.appendChild(root);
    }
  }

  document.addEventListener('focusin', function(e){
    remember(e.target);
  }, true);

  document.addEventListener('click', function(e){
    remember(e.target);
  }, true);

  function active(){
    return activeTarget || activeAnswerInput || window.__doPotegiActiveMathInput || null;
  }

  function wireKeyboard(){
    ensureBuilders();

    const keyboard = kb();
    if(!keyboard || keyboard.dataset.v45 === '1') return;
    keyboard.dataset.v45 = '1';

    keyboard.addEventListener('mousedown', function(e){
      if(
        e.target.closest('[data-insert]') ||
        e.target.closest('#backspaceKey') ||
        e.target.closest('#insertFracBtn') ||
        e.target.closest('#insertPowerBtn') ||
        e.target.closest('#insertRootBtn') ||
        e.target.closest('#mathKeyboardEnterBtn')
      ){
        e.preventDefault();
      }
    }, true);

    keyboard.addEventListener('click', function(e){
      const key = e.target.closest('[data-insert]');
      const backspace = e.target.closest('#backspaceKey');
      const frac = e.target.closest('#insertFracBtn');
      const power = e.target.closest('#insertPowerBtn');
      const root = e.target.closest('#insertRootBtn');
      const enter = e.target.closest('#mathKeyboardEnterBtn');

      if(!key && !backspace && !frac && !power && !root && !enter) return;

      e.preventDefault();
      e.stopImmediatePropagation();

      const target = active();

      if(key){
        if(!target) return;

        const text = key.dataset.insert || '';
        const offset = Number(key.dataset.cursor || 0);

        // Gdy jesteś w polach pomocniczych, cyfry i znaki trafiają właśnie tam.
        // Nie wstawiamy gotowych konstrukcji typu ułamek/pierwiastek do pola podstawy/wykładnika.
        if(isBuilderInput(target) && (text.includes('\\frac') || text.includes('\\sqrt'))){
          return;
        }

        insertAt(target, text, offset);
        return;
      }

      if(backspace){
        if(target) eraseAt(target);
        return;
      }

      if(frac){
        const num = (document.getElementById('fracNum')?.value || '').trim();
        const den = (document.getElementById('fracDen')?.value || '').trim();

        if(!num || !den){
          if(typeof showToast === 'function') showToast('Wpisz licznik i mianownik.');
          return;
        }

        const answer = activeAnswerInput || window.__doPotegiActiveMathInput;
        if(!answer){
          if(typeof showToast === 'function') showToast('Kliknij najpierw pole odpowiedzi.');
          return;
        }

        insertAt(answer, '\\frac{' + num + '}{' + den + '}', 0);
        document.getElementById('fracNum').value = '';
        document.getElementById('fracDen').value = '';

        activeTarget = answer;
        activeAnswerInput = answer;
        window.__doPotegiActiveMathInput = answer;
        return;
      }

      if(power){
        const base = (document.getElementById('powerBaseInput')?.value || '').trim();
        const exp = (document.getElementById('powerExpInput')?.value || '').trim();

        if(!base || !exp){
          if(typeof showToast === 'function') showToast('Wpisz podstawę i wykładnik.');
          return;
        }

        const answer = activeAnswerInput || window.__doPotegiActiveMathInput;
        if(!answer){
          if(typeof showToast === 'function') showToast('Kliknij najpierw pole odpowiedzi.');
          return;
        }

        insertAt(answer, base + '^{' + exp + '}', 0);
        document.getElementById('powerBaseInput').value = '';
        document.getElementById('powerExpInput').value = '';

        activeTarget = answer;
        activeAnswerInput = answer;
        window.__doPotegiActiveMathInput = answer;
        return;
      }

      if(root){
        const deg = (document.getElementById('rootDegInput')?.value || '').trim();
        const val = (document.getElementById('rootValInput')?.value || '').trim();

        if(!val){
          if(typeof showToast === 'function') showToast('Wpisz liczbę pod pierwiastkiem.');
          return;
        }

        const answer = activeAnswerInput || window.__doPotegiActiveMathInput;
        if(!answer){
          if(typeof showToast === 'function') showToast('Kliknij najpierw pole odpowiedzi.');
          return;
        }

        const latex = (!deg || deg === '2') ? ('\\sqrt{' + val + '}') : ('\\sqrt[' + deg + ']{' + val + '}');
        insertAt(answer, latex, 0);

        document.getElementById('rootDegInput').value = '';
        document.getElementById('rootValInput').value = '';

        activeTarget = answer;
        activeAnswerInput = answer;
        window.__doPotegiActiveMathInput = answer;
        return;
      }

      if(enter){
        const answer = activeAnswerInput || window.__doPotegiActiveMathInput;
        if(!answer) return;

        answer.focus();
        answer.dispatchEvent(new KeyboardEvent('keydown', {
          key:'Enter',
          code:'Enter',
          keyCode:13,
          which:13,
          bubbles:true,
          cancelable:true
        }));

        setTimeout(function(){
          const next = document.querySelector('.training-answer:not([disabled]), .math-answer-input:not([disabled])');
          if(next){
            activeTarget = next;
            activeAnswerInput = next;
            window.__doPotegiActiveMathInput = next;
            next.focus();
            showKeyboard();
          }else{
            hideKeyboard();
          }
        }, 220);
      }
    }, true);
  }

  document.addEventListener('DOMContentLoaded', wireKeyboard);
  setTimeout(wireKeyboard, 300);
  setTimeout(wireKeyboard, 1000);

  const observer = new MutationObserver(wireKeyboard);
  observer.observe(document.body, {childList:true, subtree:true});
})();
