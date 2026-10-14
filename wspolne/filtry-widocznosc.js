
(function(){
  function getSavedGames(){
    return JSON.parse(localStorage.getItem("doPotegiGames") || "[]");
  }

  function normalizeType(game){
    if(!game) return "unknown";

    if(game.type === "flying") return "flying";
    if(game.type === "safe") return "safe";
    if(game.type === "puzzle") return "puzzle";
    if(game.type === "memory") return "memory";
    if(game.type === "quiz") return "quiz";
    if(game.type === "match" || game.type === "pairs") return "match";

    // starsze zapisy bez type
    if(game.questions && game.questions.length) return "quiz";
    if(game.pairs && game.pairs.length) return "match";
    if(game.tasks && game.image) return "puzzle";
    if(game.tasks && game.codeLength) return "safe";

    return "unknown";
  }

  function typeLabel(type){
    const labels = {
      match: "🔗 Łączenie w pary",
      quiz: "❓ Quiz",
      memory: "🧠 Memory",
      puzzle: "🧩 Puzzle",
      safe: "🔐 Sejf",
      flying: "🍋 Latające odpowiedzi",
      unknown: "🎮 Gra"
    };
    return labels[type] || labels.unknown;
  }

  function ensureFilterPanel(){
    const savedScreen = document.getElementById("saved");
    if(!savedScreen) return null;

    const title = savedScreen.querySelector("h1");
    let panel = document.getElementById("savedFilterPanel");

    if(!panel){
      panel = document.createElement("div");
      panel.id = "savedFilterPanel";
      panel.className = "saved-filter-panel";
      panel.innerHTML = `
        <span class="saved-filter-panel-title">Filtruj:</span>
        <button class="saved-filter-button active" data-filter="all" type="button">Wszystkie</button>
        <button class="saved-filter-button" data-filter="match" type="button">Łączenie w pary</button>
        <button class="saved-filter-button" data-filter="quiz" type="button">Quiz</button>
        <button class="saved-filter-button" data-filter="memory" type="button">Memory</button>
        <button class="saved-filter-button" data-filter="puzzle" type="button">Puzzle</button>
        <button class="saved-filter-button" data-filter="safe" type="button">Sejf</button>
        <button class="saved-filter-button" data-filter="flying" type="button">Latające odpowiedzi</button>
      `;

      if(title){
        title.insertAdjacentElement("afterend", panel);
      }else{
        savedScreen.prepend(panel);
      }
    }

    return panel;
  }

  function applyFilter(filter){
    document.querySelectorAll(".saved-game").forEach(card=>{
      const type = card.dataset.gameType || "unknown";
      card.style.display = (filter === "all" || type === filter) ? "" : "none";
    });
  }

  function setupFilterButtons(){
    const panel = ensureFilterPanel();
    if(!panel) return;

    panel.querySelectorAll(".saved-filter-button").forEach(btn=>{
      btn.onclick = function(){
        panel.querySelectorAll(".saved-filter-button").forEach(b=>b.classList.remove("active"));
        btn.classList.add("active");
        applyFilter(btn.dataset.filter);
      };
    });
  }

  function enhanceCards(){
    const saved = getSavedGames();
    const cards = document.querySelectorAll(".saved-game");

    cards.forEach((card, index)=>{
      const game = saved[index];
      const type = normalizeType(game);
      card.dataset.gameType = type;

      let badge = card.querySelector(".saved-type-badge");
      if(!badge){
        badge = document.createElement("div");
        badge.className = "saved-type-badge";
        card.insertBefore(badge, card.firstChild);
      }

      badge.textContent = typeLabel(type);

      const small = card.querySelector(".small");
      if(small && small.textContent.startsWith("Gra ·")){
        small.textContent = small.textContent.replace("Gra ·", typeLabel(type).replace(/^.. /,"") + " ·");
      }
    });
  }

  const previousRenderSaved = window.renderSavedGames;

  window.renderSavedGames = function(){
    if(previousRenderSaved) previousRenderSaved();
    ensureFilterPanel();
    enhanceCards();
    setupFilterButtons();

    const active = document.querySelector("#savedFilterPanel .saved-filter-button.active");
    applyFilter(active ? active.dataset.filter : "all");
  };

  document.addEventListener("DOMContentLoaded", function(){
    const navSaved = document.getElementById("navSaved");
    if(navSaved){
      navSaved.addEventListener("click", function(){
        setTimeout(()=>window.renderSavedGames(), 0);
      });
    }

    setTimeout(function(){
      if(document.getElementById("saved") && typeof window.renderSavedGames === "function"){
        window.renderSavedGames();
      }
    }, 200);
  });
})();
