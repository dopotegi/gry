
(function(){
  const oldRenderSaved=window.renderSavedGames;
  window.renderSavedGames=function(){
    oldRenderSaved();
    const saved=JSON.parse(localStorage.getItem("doPotegiGames")||"[]");
    document.querySelectorAll(".saved-game").forEach(function(item,i){
      const game=saved[i];
      if(game&&game.type==="flying"){
        const small=item.querySelector(".small");
        if(small) small.textContent="Latające odpowiedzi · "+(game.questions?game.questions.length:0)+" pytań";
      }
    });
  };
  const oldLoad=window.loadSavedGame;
  window.loadSavedGame=function(index){
    const saved=JSON.parse(localStorage.getItem("doPotegiGames")||"[]");
    const game=saved[index];
    if(!game||game.type!=="flying"){oldLoad(index);return;}
    document.getElementById("gameTitle").value=game.title||"Latające odpowiedzi";
    document.getElementById("gameType").value="flying";
    if(typeof onGameTypeChange==="function")onGameTypeChange();
    document.getElementById("flyingLives").value=String(game.lives||5);
    document.getElementById("flyingSpeed").value=game.speed||"normal";
    document.getElementById("flyingInput").value=(game.questions||[]).map(function(qq){
      const wrong=(qq.answers||[]).filter(a=>a!==qq.correct);
      return [qq.question,qq.correct].concat(wrong).join(" ; ");
    }).join("\n");
    showScreen("creator");buildGame(false);
  };
})();
