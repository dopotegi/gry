
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

  function uniqueBank(task){
    const bank = [];

    // Jedna pełna figura. Można użyć jej wielokrotnie.
    bank.push({
      kind: "whole",
      fill: task.den,
      den: task.den,
      shape: task.shape
    });

    // Elementy pasujące do zadania.
    for(let fill = 1; fill < task.den; fill++){
      bank.push({
        kind: "part",
        fill,
        den: task.den,
        shape: task.shape,
        distractor: false
      });
    }

    // Zmyłki: części podzielone na inną liczbę równych części.
    // Uczeń musi zwrócić uwagę nie tylko na zamalowany fragment,
    // ale także na mianownik i sposób podziału figury.
    const candidateDens = [
      task.den - 2,
      task.den - 1,
      task.den + 1,
      task.den + 2,
      2, 3, 4, 5, 6, 8, 10
    ].filter(den => den >= 2 && den <= 12 && den !== task.den);

    const distractorDens = [...new Set(candidateDens)].slice(0, 4);

    distractorDens.forEach(den => {
      const fills = new Set([
        1,
        Math.max(1, Math.min(den - 1, task.num)),
        Math.max(1, Math.min(den - 1, task.num + 1)),
        den - 1
      ]);

      [...fills].forEach(fill => {
        if(fill > 0 && fill < den){
          bank.push({
            kind: "part",
            fill,
            den,
            shape: task.shape,
            distractor: true
          });
        }
      });
    });

    return shuffle(bank);
  }

  function makeWrong(task){
    return [
      {whole: Math.max(0, task.whole - 1), num: task.num, den: task.den, shape: task.shape},
      {whole: task.whole + 1, num: task.num, den: task.den, shape: task.shape},
      {whole: task.whole, num: Math.max(1, Math.min(task.den - 1, task.num + 1)), den: task.den, shape: task.shape},
      {whole: task.whole, num: Math.max(1, task.num - 1), den: task.den, shape: task.shape}
    ].filter(o => !(o.whole === task.whole && o.num === task.num && o.den === task.den));
  }

  window.renderFractionModelsGame = function(data, container, isFullscreen){
    const wrapper = document.createElement("div");
    wrapper.className = isFullscreen ? "card" : "";

    let index = 0;
    let chosen = [];

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
      chosen = [];
      const task = data.tasks[index];
      score.textContent = (index + 1) + " / " + data.tasks.length;

      if(data.mode === "choose"){
        const choices = shuffle([task].concat(makeWrong(task)).slice(0, 3));

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
              setTimeout(() => btn.classList.remove("bad"), 550);
            }
          };
        });

      }else{
        stage.innerHTML = `
          <div class="fm-top">
            <div class="fm-question">Zbuduj model: ${fracLatex(task)}</div>
          </div>

          <div class="fm-layout">
            <div class="fm-work">
              <div class="fm-target" id="fmTarget">Klikaj elementy z banku, aby zbudować model.</div>

              <div class="fm-bank-wrap">
                <div class="bank-note">Każdy element możesz kliknąć wiele razy.</div>
                <div class="fm-bank" id="fmBank"></div>
              </div>

              <div class="fm-controls">
                <button class="btn secondary" id="fmClear" type="button">Wyczyść</button>
                <button class="btn" id="fmCheck" type="button">Sprawdź</button>
              </div>

              <div class="fm-feedback" id="fmFeedback"></div>
            </div>

            <div class="fm-answer-list">
              <div class="fm-answer">${fracLatex(task)}</div>
            </div>
          </div>
        `;

        const target = stage.querySelector("#fmTarget");
        const bankBox = stage.querySelector("#fmBank");
        const feedback = stage.querySelector("#fmFeedback");

        uniqueBank(task).forEach(piece => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "fm-piece";
          btn.innerHTML = shapeHtml(piece.shape, piece.fill, piece.den);

          btn.onclick = function(){
            chosen.push(piece);
            target.innerHTML = chosen.map(p => shapeHtml(p.shape, p.fill, p.den)).join("");
          };

          bankBox.appendChild(btn);
        });

        stage.querySelector("#fmClear").onclick = function(){
          chosen = [];
          target.textContent = "Klikaj elementy z banku, aby zbudować model.";
          feedback.textContent = "";
        };

        stage.querySelector("#fmCheck").onclick = function(){
          function gcd(a, b){
            a = Math.abs(a); b = Math.abs(b);
            while(b){ const t = b; b = a % b; a = t; }
            return a || 1;
          }

          function addFraction(aNum, aDen, bNum, bDen){
            const num = aNum * bDen + bNum * aDen;
            const den = aDen * bDen;
            const g = gcd(num, den);
            return [num / g, den / g];
          }

          function latexMixed(num, den){
            const whole = Math.floor(num / den);
            let rest = num - whole * den;
            if(rest === 0) return "\\(" + whole + "\\)";
            const g = gcd(rest, den);
            rest /= g;
            den /= g;
            if(whole > 0) return "\\(" + whole + "\\frac{" + rest + "}{" + den + "}\\)";
            return "\\(\\frac{" + rest + "}{" + den + "}\\)";
          }

          if(!chosen.length){
            feedback.textContent = "Najpierw wybierz elementy z banku.";
            feedback.className = "fm-feedback bad";
            return;
          }

          // Najpierw składamy pełne całości osobno dla każdego rodzaju podziału.
          const grouped = new Map();
          chosen.forEach(piece => {
            const den = Math.max(1, Number(piece.den) || 1);
            const fill = Math.max(0, Number(piece.fill) || 0);
            grouped.set(den, (grouped.get(den) || 0) + fill);
          });

          let builtWholes = 0;
          const leftovers = [];
          grouped.forEach((filled, den) => {
            builtWholes += Math.floor(filled / den);
            const rest = filled % den;
            if(rest) leftovers.push({num: rest, den});
          });

          // Pozostała część ułamkowa musi pochodzić z jednego rodzaju podziału.
          // Dzięki temu można użyć np. 4 połówek jako 2 całości i 2 ósmych jako 1/4,
          // ale przypadkowa mieszanka różnych niepełnych figur nie jest uznawana za model.
          let restNum = 0;
          let restDen = 1;
          if(leftovers.length === 1){
            restNum = leftovers[0].num;
            restDen = leftovers[0].den;
          }

          const fractionalMatches = leftovers.length === 0
            ? task.num === 0
            : leftovers.length === 1 && restNum * task.den === task.num * restDen;
          const ok = builtWholes === task.whole && fractionalMatches;

          // Osobno liczymy zwykłą wartość wybranych elementów tylko do komunikatu.
          let sumNum = 0;
          let sumDen = 1;
          chosen.forEach(piece => {
            [sumNum, sumDen] = addFraction(
              sumNum,
              sumDen,
              Number(piece.fill) || 0,
              Number(piece.den) || 1
            );
          });

          if(ok){
            feedback.innerHTML = "Dobrze! Zbudowany model przedstawia " + fracLatex(task) + ".";
            feedback.className = "fm-feedback good";
            if(typeof typeset === "function") typeset(feedback);
            setTimeout(next, 700);
          }else{
            const builtLatex = latexMixed(sumNum, sumDen);
            let hint = "";
            if(leftovers.length > 1){
              hint = " Najpierw połącz elementy o takim samym podziale w pełne całości.";
            }
            feedback.innerHTML = "Jeszcze nie — wybrane elementy dają razem " + builtLatex + "." + hint;
            feedback.className = "fm-feedback bad";
            if(typeof typeset === "function") typeset(feedback);
          }
        };
      }

      if(typeof typeset === "function") typeset(stage);
    }

    draw();
  };

})();
