
(function(){
  function q(id){return document.getElementById(id);}

  function parseFractionModelsInput(){
    const raw = q("fractionModelsInput").value.trim();
    const tasks = raw.split("\n").map(line=>line.trim()).filter(Boolean).map((line,i)=>{
      const parts = line.split(";").map(p=>p.trim());
      if(parts.length < 3) throw new Error("W linijce " + (i+1) + " wpisz: całości ; licznik ; mianownik.");
      const whole = Number(parts[0]);
      const num = Number(parts[1]);
      const den = Number(parts[2]);
      const shape = (parts[3] || "koło").toLowerCase();
      if(!Number.isFinite(whole) || !Number.isFinite(num) || !Number.isFinite(den) || den <= 0) throw new Error("Błędne dane w linijce " + (i+1) + ".");
      return {whole, num, den, shape:shape.includes("prost") ? "rect" : "circle"};
    });
    return {tasks, mode:q("fractionModelsMode").value || "build"};
  }

  window.parseFractionModelsInput = parseFractionModelsInput;

  const oldGet = window.getCurrentGameData;
  window.getCurrentGameData = function(){
    const type = q("gameType").value;
    const title = q("gameTitle").value.trim() || "Gra matematyczna";
    if(type === "fractionModels"){
      const parsed = parseFractionModelsInput();
      return {type:"fractionModels", title, tasks:parsed.tasks, mode:parsed.mode};
    }
    return oldGet();
  };

  const oldType = window.onGameTypeChange;
  window.onGameTypeChange = function(){
    if(oldType) oldType();
    const fields = q("fractionModelsFields");
    if(fields) fields.style.display = q("gameType").value === "fractionModels" ? "block" : "none";
  };

  const oldRender = window.renderGame;
  window.renderGame = function(data, container, isFullscreen){
    if(data && data.type === "fractionModels"){
      container.innerHTML = "";
      renderFractionModelsGame(data, container, isFullscreen);
      if(typeof typeset === "function") typeset(container);
      return;
    }
    oldRender(data, container, isFullscreen);
  };

  function fracLatex(t){return "\\(" + t.whole + "\\frac{" + t.num + "}{" + t.den + "}\\)";}

  function circleSvg(fillParts, den){
    const r=32,cx=36,cy=36; let parts="";
    for(let i=0;i<den;i++){
      const a1=-90+i*360/den, a2=-90+(i+1)*360/den;
      const x1=cx+r*Math.cos(a1*Math.PI/180), y1=cy+r*Math.sin(a1*Math.PI/180);
      const x2=cx+r*Math.cos(a2*Math.PI/180), y2=cy+r*Math.sin(a2*Math.PI/180);
      const large=(360/den)>180?1:0;
      parts += `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z" fill="${i<fillParts ? '#E30613' : '#fff'}" stroke="#111" stroke-width="1.6"/>`;
    }
    return `<span class="fm-shape"><svg viewBox="0 0 72 72">${parts}<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#111" stroke-width="1.8"/></svg></span>`;
  }

  function rectSvg(fillParts, den){
    const w=64,h=54,x=4,y=9; let parts="";
    for(let i=0;i<den;i++){
      const pw=w/den;
      parts += `<rect x="${x+i*pw}" y="${y}" width="${pw}" height="${h}" fill="${i<fillParts ? '#3300CC' : '#fff'}" stroke="#111" stroke-width="1.4"/>`;
    }
    return `<span class="fm-shape"><svg viewBox="0 0 72 72">${parts}</svg></span>`;
  }

  function shapeHtml(shape, fillParts, den){return shape === "rect" ? rectSvg(fillParts, den) : circleSvg(fillParts, den);}

  function modelHtml(task){
    let out="";
    for(let i=0;i<task.whole;i++) out += shapeHtml(task.shape, task.den, task.den);
    if(task.num>0) out += shapeHtml(task.shape, task.num, task.den);
    return out;
  }

  function makeWrong(task){
    return [
      {whole:Math.max(0,task.whole-1),num:task.num,den:task.den,shape:task.shape},
      {whole:task.whole+1,num:task.num,den:task.den,shape:task.shape},
      {whole:task.whole,num:Math.max(1,Math.min(task.den-1,task.num+1)),den:task.den,shape:task.shape},
      {whole:task.whole,num:Math.max(1,task.num-1),den:task.den,shape:task.shape}
    ].filter(o=>!(o.whole===task.whole&&o.num===task.num&&o.den===task.den));
  }

  window.renderFractionModelsGame = function(data, container, isFullscreen){
    const wrapper=document.createElement("div");
    wrapper.className=isFullscreen?"card":"";
    let index=0, chosen=[];
    wrapper.innerHTML=`<div class="game-head"><div><h2>${escapeHtml(data.title)}</h2></div><div class="score" id="fmScore">1 / ${data.tasks.length}</div></div><div class="fm-stage" id="fmStage"></div>`;
    container.appendChild(wrapper);
    const stage=wrapper.querySelector("#fmStage"), score=wrapper.querySelector("#fmScore");

    function finish(){
      stage.innerHTML=`<div class="training-card"><h2>Brawo!</h2><p>Wszystkie modele dopasowane.</p><button class="btn" type="button" id="fmAgain">Zacznij od nowa</button></div>`;
      stage.querySelector("#fmAgain").onclick=()=>window.renderFractionModelsGame(data, container, isFullscreen);
      if(typeof confetti==="function") confetti();
    }

    function next(){ if(index<data.tasks.length-1){index++; draw();} else finish(); }

    function draw(){
      chosen=[];
      const task=data.tasks[index];
      score.textContent=(index+1)+" / "+data.tasks.length;

      if(data.mode==="choose"){
        const choices=shuffle([task].concat(makeWrong(task)).slice(0,3));
        stage.innerHTML=`<div class="fm-top"><div class="fm-question">Wskaż model przedstawiający ${fracLatex(task)}</div></div><div class="fm-choice-grid">${choices.map((c,i)=>`<button type="button" class="fm-choice" data-good="${c.whole===task.whole&&c.num===task.num&&c.den===task.den}">${modelHtml(c)}</button>`).join("")}</div><div class="fm-feedback" id="fmFeedback"></div>`;
        stage.querySelectorAll(".fm-choice").forEach(btn=>{
          btn.onclick=function(){
            const fb=stage.querySelector("#fmFeedback");
            if(btn.dataset.good==="true"){btn.classList.add("good");fb.textContent="Dobrze!";fb.className="fm-feedback good";setTimeout(next,550);}
            else{btn.classList.add("bad");fb.textContent="Spróbuj jeszcze raz.";fb.className="fm-feedback bad";setTimeout(()=>btn.classList.remove("bad"),550);}
          };
        });
      }else{
        const bank=[];
        for(let i=0;i<task.whole;i++) bank.push({fill:task.den,den:task.den,shape:task.shape});
        if(task.num>0) bank.push({fill:task.num,den:task.den,shape:task.shape});
        bank.push({fill:Math.max(1,task.num-1),den:task.den,shape:task.shape});
        bank.push({fill:Math.min(task.den,task.num+1),den:task.den,shape:task.shape});

        stage.innerHTML=`<div class="fm-top"><div class="fm-question">Zbuduj model: ${fracLatex(task)}</div></div><div class="fm-layout"><div class="fm-work"><div class="fm-target" id="fmTarget">Klikaj elementy z banku, aby zbudować model.</div><div class="fm-bank" id="fmBank"></div><div class="fm-controls"><button class="btn secondary" id="fmClear" type="button">Wyczyść</button><button class="btn" id="fmCheck" type="button">Sprawdź</button></div><div class="fm-feedback" id="fmFeedback"></div></div><div class="fm-answer-list"><div class="fm-answer">${fracLatex(task)}</div></div></div>`;

        const target=stage.querySelector("#fmTarget"), bankBox=stage.querySelector("#fmBank"), feedback=stage.querySelector("#fmFeedback");
        shuffle(bank).forEach(piece=>{
          const btn=document.createElement("button");
          btn.type="button"; btn.className="fm-piece"; btn.innerHTML=shapeHtml(piece.shape,piece.fill,piece.den);
          btn.onclick=function(){chosen.push(piece);target.innerHTML=chosen.map(p=>shapeHtml(p.shape,p.fill,p.den)).join("");};
          bankBox.appendChild(btn);
        });

        stage.querySelector("#fmClear").onclick=function(){chosen=[];target.textContent="Klikaj elementy z banku, aby zbudować model.";feedback.textContent="";};
        stage.querySelector("#fmCheck").onclick=function(){
          const wholeCount=chosen.filter(p=>p.fill===task.den).length;
          const parts=chosen.filter(p=>p.fill!==task.den);
          const partSum=parts.reduce((s,p)=>s+p.fill,0);
          const ok=wholeCount===task.whole && partSum===task.num && parts.length===(task.num>0?1:0);
          if(ok){feedback.textContent="Dobrze!";feedback.className="fm-feedback good";setTimeout(next,550);}
          else{feedback.textContent="Jeszcze nie. Sprawdź liczbę całości i część ułamkową.";feedback.className="fm-feedback bad";}
        };
      }
      if(typeof typeset==="function") typeset(stage);
    }
    draw();
  };

  function attachTile(){
    const tile=q("startFractionModels");
    if(tile) tile.onclick=function(){selectGameType("fractionModels");};
  }
  document.addEventListener("DOMContentLoaded", attachTile);
  setTimeout(attachTile,300);
})();
