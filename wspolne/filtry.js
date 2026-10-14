
(function(){

const TYPE_LABELS = {
  pairs: "🔗 Łączenie w pary",
  quiz: "❓ Quiz",
  memory: "🧠 Memory",
  puzzle: "🧩 Puzzle",
  safe: "🔐 Sejf",
  flying: "🍋 Latające odpowiedzi"
};

function enhanceSavedGames(){
  const saved = JSON.parse(localStorage.getItem("doPotegiGames") || "[]");
  const cards = document.querySelectorAll(".saved-game");

  cards.forEach((card,index)=>{
    const game = saved[index];
    if(!game) return;

    card.dataset.type = game.type || "other";

    if(!card.querySelector(".saved-type-badge")){
      const badge = document.createElement("div");
      badge.className = "saved-type-badge";
      badge.textContent = TYPE_LABELS[game.type] || "Gra";
      card.insertBefore(badge, card.firstChild);
    }
  });
}

function setupFilters(){
  const buttons = document.querySelectorAll(".filter-btn");

  buttons.forEach(btn=>{
    btn.onclick = ()=>{
      buttons.forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.dataset.filter;
      const cards = document.querySelectorAll(".saved-game");

      cards.forEach(card=>{
        if(filter === "all"){
          card.style.display = "";
        } else {
          card.style.display = card.dataset.type === filter ? "" : "none";
        }
      });
    };
  });
}

const oldRender = window.renderSavedGames;

window.renderSavedGames = function(){
  if(oldRender) oldRender();
  enhanceSavedGames();
  setupFilters();
};

document.addEventListener("DOMContentLoaded", ()=>{
  setTimeout(()=>{
    if(typeof renderSavedGames === "function"){
      renderSavedGames();
    }
  },200);
});

})();
