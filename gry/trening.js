
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
  function parseTrainingInput(){
    const raw = q("trainingInput").value.trim();
    const tasks = raw.split("\n").map(line=>line.trim()).filter(Boolean).map((line,i)=>{
      const parts = line.split(";").map(p=>normalizeSlashes(p||"").trim()).filter(Boolean);
      if(parts.length < 2){ throw new Error("W linijce "+(i+1)+" wpisz przykład i odpowiedź."); }
      return {question:parts[0], answer:parts[1]};
    });
    return {tasks, mode:q("trainingMode").value || "correct"};
  }
  function renderTrainingGame(data, container, isFullscreen){
    const wrapper = document.createElement("div");
    wrapper.className = isFullscreen ? "card" : "";
    let index = 0;
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
      </div>`;
    container.appendChild(wrapper);
    const exampleBox = wrapper.querySelector("#trainingExample");
    const answerInput = wrapper.querySelector("#trainingAnswer");
    const feedback = wrapper.querySelector("#trainingFeedback");
    const checkBtn = wrapper.querySelector("#trainingCheck");
    const nextBtn = wrapper.querySelector("#trainingNext");
    const scoreBox = wrapper.querySelector("#trainingScore");
    function draw(){
      const task = data.tasks[index];
      exampleBox.innerHTML = renderMixed(task.question);
      answerInput.value = "";
      answerInput.disabled = false;
      feedback.textContent = "";
      feedback.className = "training-feedback";
      scoreBox.textContent = (index + 1) + " / " + data.tasks.length;
      nextBtn.disabled = data.mode === "correct";
      if(typeof typeset === "function") typeset(wrapper);
      setTimeout(()=>answerInput.focus(),80);
    }
    function check(){
      const task = data.tasks[index];
      const value = normalizeMathAnswer(answerInput.value);
      const answer = normalizeMathAnswer(task.answer);
      if(value === answer){
        feedback.textContent = "Dobrze!";
        feedback.className = "training-feedback good";
        answerInput.disabled = true;
        nextBtn.disabled = false;
      } else {
        feedback.textContent = "Spróbuj jeszcze raz.";
        feedback.className = "training-feedback bad";
      }
    }
    function next(){
      if(index < data.tasks.length - 1){
        index++;
        draw();
      } else {
        wrapper.innerHTML = `<div class="training-card"><h2>Koniec treningu</h2><p>Przykłady zakończone.</p><button class="btn" type="button" id="trainingAgain">Zacznij od nowa</button></div>`;
        wrapper.querySelector("#trainingAgain").onclick = function(){ renderGame(data, container, isFullscreen); };
        if(typeof confetti === "function") confetti();
      }
    }
    checkBtn.onclick = check;
    nextBtn.onclick = next;
    answerInput.addEventListener("keydown", function(e){
      if(e.key === "Enter"){ answerInput.disabled ? next() : check(); }
    });
    draw();
  }
  window.parseTrainingInput = parseTrainingInput;
  window.renderTrainingGame = renderTrainingGame;
  const oldGet = window.getCurrentGameData;
  window.getCurrentGameData = function(){
    const type = q("gameType").value;
    const title = q("gameTitle").value.trim() || "Gra matematyczna";
    if(type === "training"){
      const training = parseTrainingInput();
      return {type:"training", title, tasks:training.tasks, mode:training.mode};
    }
    return oldGet();
  };
  const oldType = window.onGameTypeChange;
  window.onGameTypeChange = function(){
    if(oldType) oldType();
    const fields = q("trainingFields");
    if(fields) fields.style.display = q("gameType").value === "training" ? "block" : "none";
  };
  const oldRender = window.renderGame;
  window.renderGame = function(data, container, isFullscreen){
    if(data.type === "training"){
      container.innerHTML = "";
      renderTrainingGame(data, container, isFullscreen);
      if(typeof typeset === "function") typeset(container);
      return;
    }
    oldRender(data, container, isFullscreen);
  };
  function attachTrainingClick(){
    const tile = q("startTraining");
    if(tile){ tile.onclick = function(){ selectGameType("training"); }; }
  }
  document.addEventListener("DOMContentLoaded", attachTrainingClick);
  setTimeout(attachTrainingClick, 300);
})();
