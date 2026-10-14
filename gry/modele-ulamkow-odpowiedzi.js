
(function(){

  function circleSvg(fillParts, den){
    const r = 32, cx = 36, cy = 36;
    let parts = "";

    for(let i = 0; i < den; i++){
      const a1 = -90 + i * 360 / den;
      const a2 = -90 + (i + 1) * 360 / den;
      const x1 = cx + r * Math.cos(a1 * Math.PI / 180);
      const y1 = cy + r * Math.sin(a1 * Math.PI / 180);
      const x2 = cx + r * Math.cos(a2 * Math.PI / 180);
      const y2 = cy + r * Math.sin(a2 * Math.PI / 180);
      const large = (360 / den) > 180 ? 1 : 0;

      parts += `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z" fill="${i < fillParts ? '#E30613' : '#fff'}" stroke="#111" stroke-width="1.6"/>`;
    }

    return `<span class="fm-shape"><svg viewBox="0 0 72 72">${parts}<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#111" stroke-width="1.8"/></svg></span>`;
  }

  function rectSvg(fillParts, den){
    const w = 64, h = 54, x = 4, y = 9;
    let parts = "";

    for(let i = 0; i < den; i++){
      const pw = w / den;
      parts += `<rect x="${x + i * pw}" y="${y}" width="${pw}" height="${h}" fill="${i < fillParts ? '#3300CC' : '#fff'}" stroke="#111" stroke-width="1.4"/>`;
    }

    return `<span class="fm-shape"><svg viewBox="0 0 72 72">${parts}</svg></span>`;
  }

  function shapeHtml(shape, fillParts, den){
    return shape === "rect" ? rectSvg(fillParts, den) : circleSvg(fillParts, den);
  }

  function fracLatex(task){
    return "\\(" + task.whole + "\\frac{" + task.num + "}{" + task.den + "}\\)";
  }

  function modelHtml(task){
    let out = "";

    for(let i = 0; i < task.whole; i++){
      out += shapeHtml(task.shape, task.den, task.den);
    }

    if(task.num > 0){
      out += shapeHtml(task.shape, task.num, task.den);
    }

    return out;
  }

  function uniqueChoiceKey(t){
    return [t.whole, t.num, t.den, t.shape].join("|");
  }

  function harderWrongChoices(task){
    const choices = [];
    const seen = new Set([uniqueChoiceKey(task)]);
    const correctValue = task.whole + task.num / task.den;

    function add(candidate){
      if(candidate.whole < 0 || candidate.num <= 0 || candidate.den <= 1) return;
      if(candidate.num >= candidate.den) return;

      // Nie dodajemy modelu równoważnego poprawnej odpowiedzi.
      const candidateValue = candidate.whole + candidate.num / candidate.den;
      if(Math.abs(candidateValue - correctValue) < 0.0000001) return;

      const key = uniqueChoiceKey(candidate);
      if(seen.has(key)) return;

      seen.add(key);
      choices.push(candidate);
    }

    // Najmocniejsze zmyłki: ta sama liczba całości i ten sam mianownik.
    add({whole:task.whole, num:task.num - 1, den:task.den, shape:task.shape});
    add({whole:task.whole, num:task.num + 1, den:task.den, shape:task.shape});
    add({whole:task.whole, num:task.num - 2, den:task.den, shape:task.shape});
    add({whole:task.whole, num:task.num + 2, den:task.den, shape:task.shape});

    // Ten sam licznik, ale bardzo podobny mianownik.
    add({whole:task.whole, num:task.num, den:task.den - 1, shape:task.shape});
    add({whole:task.whole, num:task.num, den:task.den + 1, shape:task.shape});
    add({whole:task.whole, num:task.num, den:task.den - 2, shape:task.shape});
    add({whole:task.whole, num:task.num, den:task.den + 2, shape:task.shape});

    // Część dopełniająca do całości, np. 3/8 zamiast 5/8.
    add({whole:task.whole, num:task.den - task.num, den:task.den, shape:task.shape});

    // Zmyłka w liczbie całości przy zachowaniu tej samej części ułamkowej.
    add({whole:task.whole - 1, num:task.num, den:task.den, shape:task.shape});
    add({whole:task.whole + 1, num:task.num, den:task.den, shape:task.shape});

    // Uzupełnienie puli: nadal preferujemy tę samą liczbę całości
    // oraz mianowniki zbliżone do poprawnego.
    for(let distance = 1; choices.length < 8 && distance <= 6; distance++){
      const denominators = [task.den - distance, task.den + distance];
      denominators.forEach(d => {
        if(d > 1){
          for(let n = 1; n < d && choices.length < 8; n++){
            add({whole:task.whole, num:n, den:d, shape:task.shape});
          }
        }
      });
    }

    return choices;
  }

  function chooseModeChoices(task){
    const wrong = harderWrongChoices(task);

    // 6 odpowiedzi: pięć podobnych zmyłek i jedna odpowiedź poprawna.
    return shuffle([task].concat(wrong.slice(0, 5)));
  }

  const previousRenderFractionModelsGame = window.renderFractionModelsGame;

  window.renderFractionModelsGame = function(data, container, isFullscreen){
    // Nadpisujemy tylko tryb wyboru. Tryb budowania zostaje z wersji v56.
    if(data.mode !== "choose"){
      return previousRenderFractionModelsGame(data, container, isFullscreen);
    }

    const wrapper = document.createElement("div");
    wrapper.className = isFullscreen ? "card" : "";

    let index = 0;

    wrapper.innerHTML = `
      <div class="game-head">
        <div><h2>${escapeHtml(data.title)}</h2></div>
        <div class="score" id="fmScore">1 / ${data.tasks.length}</div>
      </div>
      <div class="fm-stage" id="fmStage"></div>
    `;

    container.innerHTML = "";
    container.appendChild(wrapper);

    const stage = wrapper.querySelector("#fmStage");
    const score = wrapper.querySelector("#fmScore");

    function finish(){
      stage.innerHTML = `
        <div class="training-card">
          <h2>Brawo!</h2>
          <p>Wszystkie modele dopasowane.</p>
          <button class="btn" type="button" id="fmAgain">Zacznij od nowa</button>
        </div>
      `;

      stage.querySelector("#fmAgain").onclick = function(){
        window.renderFractionModelsGame(data, container, isFullscreen);
      };

      if(typeof confetti === "function") confetti();
    }

    function next(){
      if(index < data.tasks.length - 1){
        index++;
        draw();
      }else{
        finish();
      }
    }

    function draw(){
      const task = data.tasks[index];
      score.textContent = (index + 1) + " / " + data.tasks.length;

      const choices = chooseModeChoices(task);

      stage.innerHTML = `
        <div class="fm-top">
          <div class="fm-question">Wybierz model dla ${fracLatex(task)}</div>
        </div>
        <div class="fm-choice-grid">
          ${choices.map(c => `
            <button type="button" class="fm-choice" data-good="${c.whole === task.whole && c.num === task.num && c.den === task.den}">
              ${modelHtml(c)}
            </button>
          `).join("")}
        </div>
        <div class="fm-feedback" id="fmFeedback"></div>
      `;

      stage.querySelectorAll(".fm-choice").forEach(btn => {
        btn.onclick = function(){
          const fb = stage.querySelector("#fmFeedback");

          if(btn.dataset.good === "true"){
            btn.classList.add("good");
            fb.textContent = "Dobrze!";
            fb.className = "fm-feedback good";
            setTimeout(next, 550);
          }else{
            btn.classList.add("bad");
            fb.textContent = "Spróbuj jeszcze raz.";
            fb.className = "fm-feedback bad";
            setTimeout(() => btn.classList.remove("bad"), 650);
          }
        };
      });

      if(typeof typeset === "function") typeset(stage);
    }

    draw();
  };

})();
