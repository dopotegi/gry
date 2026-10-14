
  let currentGameData = null;
  let currentFullscreenData = null;

  document.addEventListener('DOMContentLoaded', function() {
    const navCreator = document.getElementById('navCreator');
    const navSaved = document.getElementById('navSaved');

    if(navCreator) navCreator.addEventListener('click', function() { showScreen('start'); });
    if(navSaved) navSaved.addEventListener('click', function() { showScreen('saved'); });

    document.getElementById('startMatch').addEventListener('click', function() { selectGameType('match'); });
    document.getElementById('startQuiz').addEventListener('click', function() { selectGameType('quiz'); });
    document.getElementById('startMemory').addEventListener('click', function() { selectGameType('memory'); });
    document.getElementById('startPuzzle').addEventListener('click', function() { selectGameType('puzzle'); });
    document.getElementById('startSafe').addEventListener('click', function() { selectGameType('safe'); });

    document.getElementById('gameType').addEventListener('change', function() {
      onGameTypeChange();
      buildGame(false);
    });

    document.getElementById('previewBtn').addEventListener('click', function() { buildGame(false); });
    document.getElementById('fullscreenBtn').addEventListener('click', function() { buildGame(true); });
    document.getElementById('saveBtn').addEventListener('click', saveCurrentGame);

    document.getElementById('restartFullBtn').addEventListener('click', restartFullscreenGame);
    document.getElementById('closeFullBtn').addEventListener('click', closeFullscreen);

    setupMathKeyboard();
    setupPuzzleImages();

    onGameTypeChange();
    renderSavedGames();
    showScreen('saved');
  });

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
    document.getElementById(id).classList.add('active');
    if(id === 'saved') renderSavedGames();
  }

  function selectGameType(type) {
    if(typeof clearEditingState === "function") clearEditingState();
    document.getElementById('gameType').value = type;
    onGameTypeChange();
    showScreen('creator');
    requestAnimationFrame(function() { buildGame(false); });
  }

  function onGameTypeChange() {
    const type = document.getElementById('gameType').value;
    document.getElementById('matchFields').style.display = type === 'match' ? 'block' : 'none';
    const sortFields = document.getElementById('sortFields'); if(sortFields) sortFields.style.display = type === 'sort' ? 'block' : 'none';
    document.getElementById('quizFields').style.display = type === 'quiz' ? 'block' : 'none';
    document.getElementById('memoryFields').style.display = type === 'memory' ? 'block' : 'none';
    document.getElementById('puzzleFields').style.display = type === 'puzzle' ? 'block' : 'none';
    document.getElementById('safeFields').style.display = type === 'safe' ? 'block' : 'none';
    if(type === 'puzzle') markSelectedPuzzleImage(document.getElementById('puzzleImage').value.trim());
  }

  function normalizeSlashes(v) {
    return String(v || '').replace(/\\\\/g, '\\').trim();
  }

  function parseMatchInput() {
    const raw = document.getElementById('pairsInput').value.trim();
    return raw.split('\n').map(function(line) { return line.trim(); }).filter(Boolean).map(function(line, i) {
      const parts = line.split(';').map(function(p) { return normalizeSlashes(p); }).filter(Boolean);
      if(parts.length < 2) throw new Error('W linijce ' + (i+1) + ' brakuje średnika.');
      return { id:'p' + i + '_' + Date.now(), left:parts[0], right:parts[1] };
    });
  }

  
  
  function parseSafeInput() {
    const raw = document.getElementById('safeInput').value.trim();

    return raw.split('\n').map(function(line, i) {

      const parts = line.split(';').map(function(p){
        return normalizeSlashes(p);
      }).filter(Boolean);

      if(parts.length < 3){
        throw new Error('W linijce ' + (i+1) + ' wpisz działanie, odpowiedź i cyfrę kodu.');
      }

      return {
        question: parts[0],
        answer: parts[1],
        digit: parts[2]
      };

    });
  }


function parsePuzzleInput() {
    const raw = document.getElementById('puzzleInput').value.trim();

    const tasks = raw.split('\n').map(function(line) {
      return line.trim();
    }).filter(Boolean).map(function(line, i) {

      const parts = line.split(';').map(function(p) {
        return normalizeSlashes(p);
      }).filter(Boolean);

      if(parts.length < 2) {
        throw new Error('W linijce ' + (i+1) + ' brakuje średnika.');
      }

      return {
        question: parts[0],
        answer: parts[1]
      };

    });

    return {
      tasks: tasks,
      image: document.getElementById('puzzleImage').value.trim()
    };
  }

function parseMemoryInput() {
    const raw = document.getElementById('memoryInput').value.trim();
    return raw.split('\n').map(function(line) { return line.trim(); }).filter(Boolean).map(function(line, i) {
      const parts = line.split(';').map(function(p) { return normalizeSlashes(p); }).filter(Boolean);
      if(parts.length < 2) throw new Error('W linijce ' + (i+1) + ' brakuje średnika.');
      return { id:'m' + i + '_' + Date.now(), left:parts[0], right:parts[1] };
    });
  }

  function parseQuizInput() {
    const raw = document.getElementById('quizInput').value.trim();
    return raw.split('\n').map(function(line) { return line.trim(); }).filter(Boolean).map(function(line, i) {
      const parts = line.split(';').map(function(p) { return normalizeSlashes(p); }).filter(Boolean);
      if(parts.length < 5) throw new Error('W linijce ' + (i+1) + ' wpisz pytanie i cztery odpowiedzi.');
      return {
        question: parts[0],
        correct: parts[1],
        answers: shuffle([parts[1], parts[2], parts[3], parts[4]])
      };
    });
  }

  function getCurrentGameData() {
    const type = document.getElementById('gameType').value;
    const title = document.getElementById('gameTitle').value.trim() || 'Gra matematyczna';

    if(type === 'match') {
      const pairs = parseMatchInput();
      if(pairs.length < 2) throw new Error('Dodaj przynajmniej dwie pary.');
      return { type:type, title:title, pairs:pairs };
    }

    if(type === 'memory') {
      const pairs = parseMemoryInput();
      if(pairs.length < 2) throw new Error('Dodaj przynajmniej dwie pary.');
      return { type:type, title:title, pairs:pairs };
    }

    if(type === 'puzzle') {
      const puzzle = parsePuzzleInput();
      return {
        type:type,
        title:title,
        tasks:puzzle.tasks,
        image:puzzle.image
      };
    }

    if(type === 'safe') {
      const safe = parseSafeInput();
      return {
        type:type,
        title:title,
        tasks:safe.tasks,
        codeLength:safe.codeLength
      };
    }

    const questions = parseQuizInput();
    if(questions.length < 1) throw new Error('Dodaj przynajmniej jedno pytanie.');
    return { type:type, title:title, questions:questions };
  }

  function buildGame(fullscreen) {
    try {
      currentGameData = getCurrentGameData();
      if(fullscreen) {
        openFullscreen(currentGameData);
      } else {
        const preview = document.getElementById('preview');
        preview.innerHTML = '';
        renderGame(currentGameData, preview, false);
      }
    } catch(e) {
      showToast(e.message);
    }
  }

  function openFullscreen(data) {
    currentFullscreenData = JSON.parse(JSON.stringify(data));
    document.getElementById('fullscreenTitle').textContent = data.title;
    document.getElementById('fullscreenSubtitle').textContent = data.type === 'match' ? 'łączenie w pary' : (data.type === 'memory' ? 'memory' : (data.type === 'connect4' ? '4 w linii' : (data.type === 'treasure' ? 'poszukiwanie skarbów' : (data.type === 'truefalse' ? 'prawda / fałsz' : 'quiz'))));
    document.getElementById('fullscreenGame').classList.add('active');
    renderGame(currentFullscreenData, document.getElementById('fullscreenContent'), true);
  }

  function closeFullscreen() {
    document.getElementById('fullscreenGame').classList.remove('active');
  }

  function restartFullscreenGame() {
    if(currentFullscreenData) openFullscreen(currentFullscreenData);
  }

  function renderGame(data, container, isFullscreen) {
    container.innerHTML = '';
    if(data.type === 'quiz') renderQuizGame(data, container, isFullscreen);
    else if(data.type === 'memory') renderMemoryGame(data, container, isFullscreen);
    else if(data.type === 'puzzle') renderPuzzleGame(data, container, isFullscreen);
    else if(data.type === 'safe') renderSafeGame(data, container, isFullscreen);
    else renderMatchGame(data, container, isFullscreen);
    typeset(container);
  }
  function renderMixed(value) {
    let v = normalizeSlashes(value);
    if(!v) return '';

    if(v.includes('\\(') || v.includes('\\[') || v.includes('$')) {
      return v;
    }

    const placeholders = [];

    function protect(regex) {
      v = v.replace(regex, function(match) {
        const key = '%%MATH_' + placeholders.length + '%%';
        placeholders.push(match.trim());
        return key;
      });
    }

    protect(/\\frac\{[^{}]+\}\{[^{}]+\}/g);
    protect(/\\dfrac\{[^{}]+\}\{[^{}]+\}/g);
    protect(/\\sqrt\{[^{}]+\}/g);
    protect(/[0-9]+(?:[,.][0-9]+)?\s*\\cdot\s*[0-9]+(?:[,.][0-9]+)?/g);
    protect(/[0-9]+(?:[,.][0-9]+)?\s*\\times\s*[0-9]+(?:[,.][0-9]+)?/g);
    protect(/[0-9]+(?:[,.][0-9]+)?\s*\\div\s*[0-9]+(?:[,.][0-9]+)?/g);
    protect(/[0-9]+(?:[,.][0-9]+)?\s*[\+\-\:\/]\s*[0-9]+(?:[,.][0-9]+)?/g);
    protect(/[a-zA-Z0-9]+(?:\{[^}]+\})?\^[{]?[a-zA-Z0-9+\-]+[}]?/g);

    let out = escapeHtml(v);
    placeholders.forEach(function(math, i) {
      out = out.replaceAll('%%MATH_' + i + '%%', '\\(' + math + '\\)');
    });

    return out;
  }



  const puzzleImageLibrary = [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1546182990-dffeafbe841d?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517976487492-5750f3195933?q=80&w=1200&auto=format&fit=crop'
  ];

  function setupPuzzleImages() {
    const input = document.getElementById('puzzleImage');
    const gallery = document.getElementById('imageGallery');
    const randomBtn = document.getElementById('randomImageBtn');
    const upload = document.getElementById('uploadPuzzleImage');

    if(!input || !gallery || !randomBtn || !upload) return;

    gallery.innerHTML = '';

    puzzleImageLibrary.forEach(function(url, index) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'image-choice';
      btn.dataset.url = url;
      btn.innerHTML = '<img src="' + url + '" alt="Obrazek ' + (index + 1) + '">';

      btn.addEventListener('click', function() {
        setPuzzleImage(url);
      });

      gallery.appendChild(btn);
    });

    randomBtn.addEventListener('click', function() {
      const random = puzzleImageLibrary[Math.floor(Math.random() * puzzleImageLibrary.length)];
      setPuzzleImage(random);
      buildGame(false);
    });

    upload.addEventListener('change', function(e) {
      const file = e.target.files && e.target.files[0];
      if(!file) return;

      const reader = new FileReader();
      reader.onload = function(ev) {
        setPuzzleImage(ev.target.result);
        buildGame(false);
      };
      reader.readAsDataURL(file);
    });

    input.addEventListener('input', function() {
      markSelectedPuzzleImage(input.value.trim());
    });

    markSelectedPuzzleImage(input.value.trim());
  }

  function setPuzzleImage(url) {
    const input = document.getElementById('puzzleImage');
    if(!input) return;
    input.value = url;
    markSelectedPuzzleImage(url);
  }

  function markSelectedPuzzleImage(url) {
    document.querySelectorAll('.image-choice').forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.url === url);
    });
  }


  let activeMathInput = null;

  function setupMathKeyboard() {
    const keyboard = document.getElementById('mathKeyboard');
    const closeBtn = document.getElementById('closeKeyboardBtn');
    const insertFracBtn = document.getElementById('insertFracBtn');
    const backspaceBtn = document.getElementById('backspaceKey');

    document.addEventListener('focusin', function(e) {
      if(e.target.classList && e.target.classList.contains('math-answer-input')) {
        activeMathInput = e.target;
        keyboard.classList.add('active');
        document.body.classList.add('keyboard-open');

        setTimeout(function(){
          e.target.scrollIntoView({
            behavior:'smooth',
            block:'center'
          });
        }, 120);
      }
    });

    closeBtn.addEventListener('click', function() {
      keyboard.classList.remove('active');
      document.body.classList.remove('keyboard-open');
    });

    keyboard.querySelectorAll('[data-insert]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        const text = btn.dataset.insert || '';
        const cursorOffset = Number(btn.dataset.cursor || 0);
        insertIntoMathInput(text, cursorOffset);
      });
    });

    insertFracBtn.addEventListener('click', function() {
      const num = document.getElementById('fracNum').value.trim();
      const den = document.getElementById('fracDen').value.trim();

      if(!num || !den) {
        showToast('Wpisz licznik i mianownik.');
        return;
      }

      insertIntoMathInput('\\frac{' + num + '}{' + den + '}', 0);
      document.getElementById('fracNum').value = '';
      document.getElementById('fracDen').value = '';
    });

    backspaceBtn.addEventListener('click', function() {
      if(!activeMathInput) return;

      const start = activeMathInput.selectionStart;
      const end = activeMathInput.selectionEnd;
      const value = activeMathInput.value;

      if(start !== end) {
        activeMathInput.value = value.slice(0, start) + value.slice(end);
        activeMathInput.setSelectionRange(start, start);
      } else if(start > 0) {
        activeMathInput.value = value.slice(0, start - 1) + value.slice(start);
        activeMathInput.setSelectionRange(start - 1, start - 1);
      }

      activeMathInput.focus();
    });
  }

  function insertIntoMathInput(text, cursorOffset) {
    if(!activeMathInput) return;

    const start = activeMathInput.selectionStart ?? activeMathInput.value.length;
    const end = activeMathInput.selectionEnd ?? activeMathInput.value.length;
    const value = activeMathInput.value;

    activeMathInput.value = value.slice(0, start) + text + value.slice(end);

    const newPos = start + text.length + cursorOffset;
    activeMathInput.focus();
    activeMathInput.setSelectionRange(newPos, newPos);
  }

  function normalizeMathAnswer(value) {
    let v = normalizeSlashes(value);

    v = v.replace(/\s/g, '');
    v = v.replaceAll('\\dfrac', '\\frac');
    v = v.replaceAll('\\left', '');
    v = v.replaceAll('\\right', '');
    v = v.replaceAll('\\(', '');
    v = v.replaceAll('\\)', '');
    v = v.replaceAll('$', '');

    // Uczeń może wpisać 3/4 zamiast \frac{3}{4}.
    v = v.replace(/^(-?\d+)\/(-?\d+)$/, '\\frac{$1}{$2}');

    // Uczeń może wpisać 0,75 lub 0.75, ale tego nie zamieniamy automatycznie na ułamek,
    // bo nie zawsze chcemy akceptować zapis dziesiętny jako ten sam typ odpowiedzi.
    return v;
  }


  function saveCurrentGame() {
    try {
      const data = getCurrentGameData();
      const saved = JSON.parse(localStorage.getItem('doPotegiGames') || '[]');
      data.savedAt = new Date().toISOString();
      saved.unshift(data);
      localStorage.setItem('doPotegiGames', JSON.stringify(saved));
      showToast('Gra zapisana.');
    } catch(e) {
      showToast(e.message);
    }
  }

  function renderSavedGames() {
    const box = document.getElementById('savedList');
    const saved = JSON.parse(localStorage.getItem('doPotegiGames') || '[]');

    if(!saved.length) {
      box.innerHTML = '<p>Nie masz jeszcze zapisanych gier.</p>';
      return;
    }

    box.innerHTML = '';

    saved.forEach(function(game, index) {
      const item = document.createElement('div');
      item.className = 'saved-game';
      const count = game.type === 'quiz' ? game.questions.length + ' pytań' : game.pairs.length + ' par';

      item.innerHTML = `
        <div>
          <strong>${escapeHtml(game.title)}</strong>
          <span class="small">${game.type === 'match' ? 'Łączenie w pary' : (game.type === 'memory' ? 'Memory' : 'Quiz')} · ${count}</span>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end;">
          <button class="btn small" type="button" data-action="edit">Edytuj</button>
          <button class="btn red small" type="button" data-action="play">Graj</button>
          <button class="btn secondary small" type="button" data-action="delete">Usuń</button>
        </div>
      `;

      item.querySelector('[data-action="edit"]').addEventListener('click', function() { loadSavedGame(index); });
      item.querySelector('[data-action="play"]').addEventListener('click', function() { playSavedGame(index); });
      item.querySelector('[data-action="delete"]').addEventListener('click', function() { deleteSavedGame(index); });

      box.appendChild(item);
    });
  }

  function loadSavedGame(index) {
    const saved = JSON.parse(localStorage.getItem('doPotegiGames') || '[]');
    const game = saved[index];
    if(!game) return;

    document.getElementById('gameTitle').value = game.title;
    document.getElementById('gameType').value = game.type;
    onGameTypeChange();

    if(game.type === 'match') {
      document.getElementById('pairsInput').value = game.pairs.map(function(p) { return p.left + ' ; ' + p.right; }).join('\n');
    } else if(game.type === 'memory') {
      document.getElementById('memoryInput').value = game.pairs.map(function(p) { return p.left + ' ; ' + p.right; }).join('\n');
    } else {
      document.getElementById('quizInput').value = game.questions.map(function(q) {
        const wrong = q.answers.filter(function(a) { return a !== q.correct; }).slice(0,3);
        return [q.question, q.correct].concat(wrong).join(' ; ');
      }).join('\n');
    }

    showScreen('creator');
    buildGame(false);
  }

  function playSavedGame(index) {
    const saved = JSON.parse(localStorage.getItem('doPotegiGames') || '[]');
    const game = saved[index];
    if(game) openFullscreen(game);
  }

  function deleteSavedGame(index) {
    const saved = JSON.parse(localStorage.getItem('doPotegiGames') || '[]');
    saved.splice(index, 1);
    localStorage.setItem('doPotegiGames', JSON.stringify(saved));
    renderSavedGames();
  }

  function shuffle(array) {
    const arr = Array.isArray(array) ? [...array] : [];
    for(let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'","&#039;");
  }

  function typeset(container) {
    if(window.MathJax && MathJax.typesetPromise) {
      MathJax.typesetPromise([container]).catch(function() {});
    }
  }

  function showToast(text) {
    const toast = document.getElementById('toast');
    toast.textContent = text;
    toast.classList.add('show');
    setTimeout(function() { toast.classList.remove('show'); }, 2200);
  }

  function confetti() {
    const box = document.getElementById('confetti');
    box.innerHTML = '';
    for(let i=0; i<45; i++) {
      const piece = document.createElement('span');
      piece.className = 'piece';
      piece.style.left = Math.random() * 100 + 'vw';
      piece.style.animationDelay = Math.random() * .25 + 's';
      piece.style.transform = 'rotate(' + Math.random() * 180 + 'deg)';
      box.appendChild(piece);
    }
    setTimeout(function() { box.innerHTML = ''; }, 1200);
  }

  document.addEventListener('keydown', function(e) {
    if(e.key === 'Escape') closeFullscreen();
  });
