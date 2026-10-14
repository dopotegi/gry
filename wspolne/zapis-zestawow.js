
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

  window.saveCurrentGame = function(){
    try{
      const data = window.getCurrentGameData ? window.getCurrentGameData() : getCurrentGameData();

      data.savedAt = new Date().toISOString();
      data.savedId = "game_" + Date.now();

      const saved = JSON.parse(localStorage.getItem("doPotegiGames") || "[]");
      saved.unshift(data);
      localStorage.setItem("doPotegiGames", JSON.stringify(saved));

      showToast("Gra zapisana.");
      window.renderSavedGames();

    }catch(e){
      showToast(e.message || "Nie udało się zapisać gry.");
    }
  };

  window.renderSavedGames = function(){
    const box = q("savedList");
    if(!box) return;

    const saved = JSON.parse(localStorage.getItem("doPotegiGames") || "[]");

    if(!saved.length){
      box.innerHTML = "<p>Nie masz jeszcze zapisanych gier.</p>";
      return;
    }

    box.innerHTML = "";

    saved.forEach(function(game, index){
      const item = document.createElement("div");
      item.className = "saved-game";

      let typeLabel = "Gra";
      let count = "";

      if(game.type === "match"){
        typeLabel = "Łączenie w pary";
        count = (game.pairs ? game.pairs.length : 0) + " par";
      }else if(game.type === "quiz"){
        typeLabel = "Quiz";
        count = (game.questions ? game.questions.length : 0) + " pytań";
      }else if(game.type === "memory"){
        typeLabel = "Memory";
        count = (game.pairs ? game.pairs.length : 0) + " par";
      }else if(game.type === "puzzle"){
        typeLabel = "Puzzle";
        count = (game.tasks ? game.tasks.length : 0) + " zadań";
      }else if(game.type === "safe"){
        typeLabel = "Sejf";
        count = (game.tasks ? game.tasks.length : 0) + " zadań";
      }

      item.innerHTML = `
        <div>
          <strong>${escapeHtml(game.title || "Gra matematyczna")}</strong>
          <span class="small">${typeLabel} · ${count}</span>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end;">
          <button class="btn small" type="button" data-action="edit">Edytuj</button>
          <button class="btn red small" type="button" data-action="play">Graj</button>
          <button class="btn secondary small" type="button" data-action="delete">Usuń</button>
        </div>
      `;

      item.querySelector('[data-action="edit"]').addEventListener("click", function(){
        window.loadSavedGame(index);
      });

      item.querySelector('[data-action="play"]').addEventListener("click", function(){
        window.playSavedGame(index);
      });

      item.querySelector('[data-action="delete"]').addEventListener("click", function(){
        window.deleteSavedGame(index);
      });

      box.appendChild(item);
    });
  };

  window.loadSavedGame = function(index){
    const saved = JSON.parse(localStorage.getItem("doPotegiGames") || "[]");
    const game = saved[index];
    if(!game) return;

    q("gameTitle").value = game.title || "Gra matematyczna";
    q("gameType").value = game.type;

    if(typeof onGameTypeChange === "function") onGameTypeChange();

    if(game.type === "match"){
      q("pairsInput").value = (game.pairs || []).map(function(p){
        return p.left + " ; " + p.right;
      }).join("\n");
    }else if(game.type === "quiz"){
      q("quizInput").value = (game.questions || []).map(function(question){
        const wrong = (question.answers || []).filter(function(a){
          return a !== question.correct;
        }).slice(0,3);
        return [question.question, question.correct].concat(wrong).join(" ; ");
      }).join("\n");
    }else if(game.type === "memory"){
      q("memoryInput").value = (game.pairs || []).map(function(p){
        return p.left + " ; " + p.right;
      }).join("\n");
    }else if(game.type === "puzzle"){
      q("puzzleInput").value = (game.tasks || []).map(function(t){
        return t.question + " ; " + t.answer;
      }).join("\n");

      if(game.image && q("puzzleImage")){
        q("puzzleImage").value = game.image;
      }

      if(typeof markSelectedPuzzleImage === "function" && game.image){
        markSelectedPuzzleImage(game.image);
      }
    }else if(game.type === "safe"){
      if(q("safeCodeLength")){
        q("safeCodeLength").value = String(game.codeLength || 4);
      }

      q("safeInput").value = (game.tasks || []).map(function(t){
        return t.question + " ; " + t.answer + " ; " + (t.digit || "");
      }).join("\n");
    }

    showScreen("creator");
    buildGame(false);
  };

  window.playSavedGame = function(index){
    const saved = JSON.parse(localStorage.getItem("doPotegiGames") || "[]");
    const game = saved[index];
    if(game){
      openFullscreen(game);
    }
  };

  window.deleteSavedGame = function(index){
    const saved = JSON.parse(localStorage.getItem("doPotegiGames") || "[]");
    saved.splice(index, 1);
    localStorage.setItem("doPotegiGames", JSON.stringify(saved));
    window.renderSavedGames();
  };

  document.addEventListener("DOMContentLoaded", function(){
    const saveBtn = q("saveBtn");
    const navSaved = q("navSaved");

    if(saveBtn){
      saveBtn.onclick = function(e){
        e.preventDefault();
        window.saveCurrentGame();
      };
    }

    if(navSaved){
      navSaved.onclick = function(e){
        e.preventDefault();
        showScreen("saved");
        window.renderSavedGames();
      };
    }
  });
})();
