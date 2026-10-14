
(function(){
  function q(id){return document.getElementById(id);}

  function parseFlyingInput(){
    const raw=q("flyingInput").value.trim();
    const questions=raw.split("\n").map(x=>x.trim()).filter(Boolean).map((line,i)=>{
      const parts=line.split(";").map(p=>normalizeSlashes(p||"").trim()).filter(Boolean);
      if(parts.length<3) throw new Error("W linijce "+(i+1)+" wpisz pytanie, poprawną odpowiedź i przynajmniej jedną błędną.");
      return {question:parts[0], correct:parts[1], answers:shuffle(parts.slice(1))};
    });
    return {questions, lives:Number(q("flyingLives").value||5), speed:q("flyingSpeed").value||"normal"};
  }
  window.parseFlyingInput=parseFlyingInput;

  const oldGet=window.getCurrentGameData;
  window.getCurrentGameData=function(){
    const type=q("gameType").value;
    const title=q("gameTitle").value.trim()||"Gra matematyczna";
    if(type==="flying"){
      const f=parseFlyingInput();
      return {type:"flying",title,questions:f.questions,lives:f.lives,speed:f.speed};
    }
    return oldGet();
  };

  const oldType=window.onGameTypeChange;
  window.onGameTypeChange=function(){
    if(oldType) oldType();
    if(q("flyingFields")) q("flyingFields").style.display=q("gameType").value==="flying"?"block":"none";
  };

  const oldRender=window.renderGame;
  window.renderGame=function(data,container,isFullscreen){
    if(data.type==="flying"){
      container.innerHTML="";
      renderFlyingGame(data,container,isFullscreen);
      if(typeof typeset==="function") typeset(container);
      return;
    }
    oldRender(data,container,isFullscreen);
  };

  window.renderFlyingGame=function(data,container,isFullscreen){
    const wrapper=document.createElement("div");
    wrapper.className=isFullscreen?"card":"";
    wrapper.innerHTML=`
      <div class="game-head"><div><h2>${escapeHtml(data.title)}</h2></div><div class="score" id="flyingScore">0 / ${data.questions.length}</div></div>
      <div class="flying-stage" id="flyingStage">
        <div class="flying-topbar"><div class="flying-pill" id="flyingTimer">0:00</div><div class="flying-pill flying-lives" id="flyingLives"></div></div>
        <div class="flying-question" id="flyingQuestion"></div>
      </div>`;
    container.appendChild(wrapper);

    const stage=wrapper.querySelector("#flyingStage");
    const questionBox=wrapper.querySelector("#flyingQuestion");
    const scoreBox=wrapper.querySelector("#flyingScore");
    const livesBox=wrapper.querySelector("#flyingLives");
    const timerBox=wrapper.querySelector("#flyingTimer");
    let index=0,score=0,lives=data.lives||5,startTime=Date.now(),animationId=null,balls=[],ended=false;
    const speedBase=data.speed==="slow"?0.55:data.speed==="fast"?1.25:0.85;

    function updateHud(){
      scoreBox.textContent=score+" / "+data.questions.length;
      livesBox.textContent="♥".repeat(Math.max(0,lives));
      const e=Math.floor((Date.now()-startTime)/1000);
      timerBox.textContent=Math.floor(e/60)+":"+String(e%60).padStart(2,"0");
    }
    function clearAnswers(){balls.forEach(b=>b.el.remove());balls=[];}
    function drawQuestion(){
      clearAnswers();
      if(index>=data.questions.length){finish(true);return;}
      const qData=data.questions[index];
      questionBox.innerHTML=renderMixed(qData.question);
      const rect=stage.getBoundingClientRect();
      shuffle(qData.answers).forEach(answer=>{
        const btn=document.createElement("button");
        btn.type="button"; btn.className="flying-answer"; btn.innerHTML=renderMixed(answer);
        const x=30+Math.random()*Math.max(120,rect.width-180);
        const y=170+Math.random()*Math.max(100,rect.height-260);
        const vx=(Math.random()<.5?-1:1)*(0.55+Math.random()*0.75)*speedBase;
        const vy=(Math.random()<.5?-1:1)*(0.45+Math.random()*0.65)*speedBase;
        btn.style.left=x+"px";btn.style.top=y+"px";
        btn.onclick=function(){
          if(ended)return;
          if(answer===qData.correct){btn.classList.add("good");score++;index++;updateHud();setTimeout(drawQuestion,320);}
          else{btn.classList.add("bad");lives--;updateHud();setTimeout(()=>btn.classList.remove("bad"),420);if(lives<=0)finish(false);}
        };
        stage.appendChild(btn);balls.push({el:btn,x,y,vx,vy});
      });
      if(typeof typeset==="function")typeset(stage);
      updateHud();
    }
    function animate(){
      if(ended)return;
      const rect=stage.getBoundingClientRect();
      balls.forEach(ball=>{
        const el=ball.el,w=el.offsetWidth||100,h=el.offsetHeight||70;
        ball.x+=ball.vx;ball.y+=ball.vy;
        if(ball.x<=10||ball.x+w>=rect.width-10)ball.vx*=-1;
        if(ball.y<=145||ball.y+h>=rect.height-10)ball.vy*=-1;
        ball.x=Math.max(10,Math.min(rect.width-w-10,ball.x));
        ball.y=Math.max(145,Math.min(rect.height-h-10,ball.y));
        el.style.left=ball.x+"px";el.style.top=ball.y+"px";
      });
      updateHud();animationId=requestAnimationFrame(animate);
    }
    function finish(won){
      ended=true;if(animationId)cancelAnimationFrame(animationId);clearAnswers();
      const f=document.createElement("div");f.className="flying-finish";
      f.innerHTML=`<div class="flying-finish-card"><h2>${won?"Brawo!":"Koniec gry"}</h2><p>Wynik: <strong>${score} / ${data.questions.length}</strong></p><button class="btn" type="button" id="flyingAgain">Zagraj ponownie</button></div>`;
      stage.appendChild(f);
      f.querySelector("#flyingAgain").onclick=()=>window.renderGame(data,container,isFullscreen);
      if(won)confetti();
    }
    updateHud();drawQuestion();animate();
  };

  document.addEventListener("DOMContentLoaded",function(){
    const start=q("startFlying"); if(start) start.onclick=function(){selectGameType("flying");};
    const type=q("gameType"); if(type) type.addEventListener("change",function(){window.onGameTypeChange(); buildGame(false);});
  });
})();
