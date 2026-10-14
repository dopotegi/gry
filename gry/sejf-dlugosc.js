
(function(){
  function q(id){ return document.getElementById(id); }

function normalizeTagList(tags){
  return Array.isArray(tags) ? tags.map(function(t){ return String(t || "").trim(); }).filter(Boolean) : [];
}

function selectedClassTags(){
  return Array.from(document.querySelectorAll('#classTagsBox input[type="checkbox"]:checked')).map(function(input){ return input.value; });
}

function setSelectedClassTags(tags){
  const chosen = new Set(normalizeTagList(tags));
  document.querySelectorAll('#classTagsBox input[type="checkbox"]').forEach(function(input){
    input.checked = chosen.has(input.value);
  });
}

function allClassTagsFromGames(){
  const tags = new Set();
  currentSavedGames().forEach(function(game){
    normalizeTagList(game.classTags || game.tags).forEach(function(tag){ tags.add(tag); });
  });
  return Array.from(tags).sort(function(a,b){ return a.localeCompare(b, 'pl'); });
}

  function norm(v){
    if(typeof normalizeSlashes === "function") return normalizeSlashes(v);
    return String(v || "").replace(/\\\\/g, "\\").trim();
  }

  function normAnswer(v){
    if(typeof normalizeMathAnswer === "function") return normalizeMathAnswer(v);
    v = norm(v).replace(/\s/g,"");
    v = v.replaceAll("\\dfrac","\\frac");
    v = v.replaceAll("\\left","");
    v = v.replaceAll("\\right","");
    v = v.replaceAll("\\(","");
    v = v.replaceAll("\\)","");
    v = v.replaceAll("$","");
    v = v.replace(/^(-?\d+)\/(-?\d+)$/, "\\frac{$1}{$2}");
    return v;
  }

  window.parseSafeInput = function(){
    const raw = q("safeInput").value.trim();
    const codeLength = Number(q("safeCodeLength").value || 4);

    const tasks = raw.split("\n")
      .map(line => line.trim())
      .filter(Boolean)
      .map((line, i) => {
        const parts = line.split(";").map(p => norm(p || "").trim());

        if(parts.length < 2 || !parts[0] || !parts[1]){
          throw new Error("W linijce " + (i + 1) + " wpisz działanie i odpowiedź.");
        }

        return {
          question: parts[0],
          answer: parts[1],
          digit: parts.length >= 3 ? parts[2].trim() : ""
        };
      });

    const digitCount = tasks.filter(t => t.digit !== "").length;

    if(digitCount !== codeLength){
      throw new Error("Wybrano kod " + codeLength + "-cyfrowy, a wpisano " + digitCount + " cyfr kodu.");
    }

    return { codeLength, tasks };
  };

  window.getCurrentGameData = function(){
    const type = q("gameType").value;
    const title = q("gameTitle").value.trim() || "Gra matematyczna";

    if(type === "safe"){
      const safe = window.parseSafeInput();
      return { type:"safe", title, tasks:safe.tasks, codeLength:safe.codeLength };
    }

    if(type === "puzzle"){
      const puzzle = parsePuzzleInput();
      return { type, title, tasks:puzzle.tasks, image:puzzle.image };
    }

    if(type === "memory"){
      const pairs = parseMemoryInput();
      if(pairs.length < 2) throw new Error("Dodaj przynajmniej dwie pary.");
      return { type, title, pairs };
    }

    if(type === "match"){
      const pairs = parseMatchInput();
      if(pairs.length < 2) throw new Error("Dodaj przynajmniej dwie pary.");
      return { type, title, pairs };
    }

    const questions = parseQuizInput();
    if(questions.length < 1) throw new Error("Dodaj przynajmniej jedno pytanie.");
    return { type, title, questions };
  };

  window.buildGame = function(fullscreen){
    try{
      currentGameData = window.getCurrentGameData();

      if(fullscreen){
        openFullscreen(currentGameData);
      }else{
        const preview = q("preview");
        preview.innerHTML = "";
        window.renderGame(currentGameData, preview, false);
      }
    }catch(e){
      showToast(e.message);
    }
  };

  window.renderSafeGame = function(data, container, isFullscreen){
    const wrapper = document.createElement("div");
    wrapper.className = isFullscreen ? "card" : "";

    const codeTasks = data.tasks.filter(task => task.digit !== "");
    const codeLength = data.codeLength || codeTasks.length;

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
            Rozwiąż wszystkie zadania, aby odkryć tajny kod.
          </div>
        </div>
      </div>
    `;

    container.appendChild(wrapper);

    const tasksBox = wrapper.querySelector("#safeTasks");
    const codeBox = wrapper.querySelector("#safeCode");
    const scoreBox = wrapper.querySelector("#safeScore");

    const digits = [];
    for(let i = 0; i < codeLength; i++){
      const digit = document.createElement("div");
      digit.className = "safe-digit hidden";
      digit.textContent = codeTasks[i] ? codeTasks[i].digit : "";
      codeBox.appendChild(digit);
      digits.push(digit);
    }

    let solved = 0;
    let revealedDigits = 0;

    data.tasks.forEach(task => {
      const taskEl = document.createElement("div");
      taskEl.className = "safe-task";

      const hasDigit = task.digit !== "";

      taskEl.innerHTML = `
        <strong>${renderMixed(task.question)}</strong>
        <input class="puzzle-answer math-answer-input" placeholder="Wpisz odpowiedź" autocomplete="off">
      `;

      const input = taskEl.querySelector("input");

      input.addEventListener("keydown", function(e){
        if(e.key !== "Enter") return;

        const value = normAnswer(input.value);
        const answer = normAnswer(task.answer);

        if(value === answer){
          taskEl.style.borderColor = "var(--green)";
          taskEl.style.background = "#effaf5";
          input.disabled = true;

          if(hasDigit && digits[revealedDigits]){
            digits[revealedDigits].classList.remove("hidden");
            revealedDigits++;
          }

          solved++;
          scoreBox.textContent = solved + " / " + data.tasks.length;

          if(revealedDigits === digits.length){
            showToast("Kod sejfu odkryty!");
            confetti();
          }
        }else{
          taskEl.style.borderColor = "var(--red)";
          taskEl.style.background = "#fff1f1";
          setTimeout(function(){
            taskEl.style.borderColor = "var(--line)";
            taskEl.style.background = "#fff";
          }, 700);
        }
      });

      tasksBox.appendChild(taskEl);
    });

    if(typeof typeset === "function") typeset(wrapper);
  };

  window.renderGame = function(data, container, isFullscreen){
    container.innerHTML = "";

    if(data.type === "safe"){
      window.renderSafeGame(data, container, isFullscreen);
    }else if(data.type === "puzzle"){
      renderPuzzleGame(data, container, isFullscreen);
    }else if(data.type === "memory"){
      renderMemoryGame(data, container, isFullscreen);
    }else if(data.type === "quiz"){
      renderQuizGame(data, container, isFullscreen);
    }else{
      renderMatchGame(data, container, isFullscreen);
    }

    if(typeof typeset === "function") typeset(container);
  };

  document.addEventListener("DOMContentLoaded", function(){
    const length = q("safeCodeLength");
    const type = q("gameType");

    if(length){
      length.addEventListener("change", function(){
        if(type && type.value === "safe"){
          window.buildGame(false);
        }
      });
    }

    if(type){
      type.addEventListener("change", function(){
        if(typeof onGameTypeChange === "function") onGameTypeChange();
        window.buildGame(false);
      });
    }
  });
})();
