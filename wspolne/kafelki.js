
(function(){
  function go(type){
    if(typeof selectGameType === "function"){
      selectGameType(type);
      return;
    }

    const select = document.getElementById("gameType");
    if(select) select.value = type;

    if(typeof onGameTypeChange === "function") onGameTypeChange();
    if(typeof showScreen === "function") showScreen("creator");
    if(typeof buildGame === "function") buildGame(false);
  }

  function attach(){
    const map = {
      startMatch: "match",
      startQuiz: "quiz",
      startMemory: "memory",
      startPuzzle: "puzzle",
      startSafe: "safe",
      startFlying: "flying",
      startTraining: "training",
      startFractionModels: "fractionModels"
    };

    Object.keys(map).forEach(function(id){
      const tile = document.getElementById(id);
      if(tile){
        tile.onclick = function(e){
          e.preventDefault();
          go(map[id]);
        };
      }
    });
  }

  document.addEventListener("DOMContentLoaded", attach);
  setTimeout(attach, 300);
  setTimeout(attach, 900);
})();
