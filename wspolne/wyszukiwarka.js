
(function(){
  function ensureSearchInput(){
    const panel = document.getElementById("savedFilterPanel");
    if(!panel) return;

    if(!document.getElementById("savedSearchInput")){
      const input = document.createElement("input");
      input.id = "savedSearchInput";
      input.className = "saved-search-box";
      input.type = "search";
      input.placeholder = "Szukaj po nazwie gry...";
      input.autocomplete = "off";

      panel.appendChild(input);

      input.addEventListener("input", applySavedSearchAndFilter);
    }
  }

  function currentFilter(){
    const active = document.querySelector("#savedFilterPanel .saved-filter-button.active");
    return active ? active.dataset.filter : "all";
  }

  function currentSearch(){
    const input = document.getElementById("savedSearchInput");
    return input ? input.value.trim().toLowerCase() : "";
  }

  window.applySavedSearchAndFilter = function(){
    const filter = currentFilter();
    const search = currentSearch();
    let visible = 0;

    document.querySelectorAll(".saved-game").forEach(card=>{
      const type = card.dataset.gameType || "unknown";
      const title = (card.querySelector("strong")?.textContent || "").toLowerCase();

      const typeOk = filter === "all" || type === filter;
      const searchOk = !search || title.includes(search);

      const show = typeOk && searchOk;
      card.style.display = show ? "" : "none";

      if(show) visible++;
    });

    let empty = document.getElementById("savedNoResults");
    const savedScreen = document.getElementById("saved");

    if(!empty && savedScreen){
      empty = document.createElement("div");
      empty.id = "savedNoResults";
      empty.className = "saved-no-results";
      empty.textContent = "Nie znaleziono zapisanej gry o takiej nazwie.";
      savedScreen.querySelector(".card")?.appendChild(empty);
    }

    if(empty){
      empty.style.display = visible === 0 ? "" : "none";
    }
  };

  const previousRender = window.renderSavedGames;

  window.renderSavedGames = function(){
    if(previousRender) previousRender();
    ensureSearchInput();

    document.querySelectorAll("#savedFilterPanel .saved-filter-button").forEach(btn=>{
      btn.onclick = function(){
        document.querySelectorAll("#savedFilterPanel .saved-filter-button").forEach(b=>b.classList.remove("active"));
        btn.classList.add("active");
        window.applySavedSearchAndFilter();
      };
    });

    window.applySavedSearchAndFilter();
  };

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(function(){
      if(typeof window.renderSavedGames === "function"){
        window.renderSavedGames();
      }
    }, 250);
  });
})();
