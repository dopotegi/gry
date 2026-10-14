
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBXrFHSIHtV17TSFYv5jlaycu0ZqNunA3s",
  authDomain: "do-potegi-gry.firebaseapp.com",
  projectId: "do-potegi-gry",
  storageBucket: "do-potegi-gry.firebasestorage.app",
  messagingSenderId: "962018953104",
  appId: "1:962018953104:web:5ec49273973cab121dd515"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let cloudUser = null;
let cloudGames = [];
let cloudReady = false;
let saveInProgress = false;
let lastSaveFingerprint = "";
let lastSaveTime = 0;
let editingGameId = null;
let editingGameIndex = null;
let savedFilterType = "all";
let savedFilterTag = "all";
let savedSearchText = "";

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

function getLocalGames(){
  try{
    return JSON.parse(localStorage.getItem("doPotegiGames") || "[]");
  }catch(e){
    return [];
  }
}

function setLocalGames(games){
  localStorage.setItem("doPotegiGames", JSON.stringify(dedupeGames(games || [])));
}

function stableStringify(value){
  if(Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
  if(value && typeof value === "object"){
    return "{" + Object.keys(value).sort().map(function(key){
      return JSON.stringify(key) + ":" + stableStringify(value[key]);
    }).join(",") + "}";
  }
  return JSON.stringify(value);
}

function gameFingerprint(game){
  const g = JSON.parse(JSON.stringify(game || {}));

  // Usuwamy pola techniczne, które zmieniają się przy każdym zapisie.
  ["savedId", "savedAt", "updatedAt", "_serverUpdatedAt", "source", "origin"].forEach(function(key){
    delete g[key];
  });

  // Przy quizach/latających odpowiedziach kolejność odpowiedzi może się zmieniać,
  // więc do porównywania sortujemy listy odpowiedzi.
  function normalizeItem(item){
    if(!item || typeof item !== "object") return item;
    const copy = JSON.parse(JSON.stringify(item));
    if(Array.isArray(copy.answers)) copy.answers = copy.answers.map(String).sort();
    return copy;
  }

  if(Array.isArray(g.questions)) g.questions = g.questions.map(normalizeItem);
  if(Array.isArray(g.tasks)) g.tasks = g.tasks.map(normalizeItem);
  if(Array.isArray(g.pairs)) g.pairs = g.pairs.map(normalizeItem);

  return stableStringify(g);
}

function dedupeGames(games){
  const seen = new Set();
  const result = [];
  (games || []).forEach(function(game){
    const fp = gameFingerprint(game);
    if(seen.has(fp)) return;
    seen.add(fp);
    result.push(game);
  });
  return result;
}

function gamesCollection(){
  if(!cloudUser) return null;
  return collection(db, "users", cloudUser.uid, "games");
}

function normalizeGameForSave(game){
  const copy = JSON.parse(JSON.stringify(game || {}));
  copy.classTags = normalizeTagList(copy.classTags || copy.tags || []);
  copy.tags = copy.classTags;
  copy.savedId = copy.savedId || ("game_" + Date.now() + "_" + Math.random().toString(36).slice(2,8));
  copy.savedAt = copy.savedAt || new Date().toISOString();
  copy.updatedAt = new Date().toISOString();
  return copy;
}

function clearEditingState(){
  editingGameId = null;
  editingGameIndex = null;
}

function markGameAsEdited(game, index){
  editingGameId = game && game.savedId ? game.savedId : null;
  editingGameIndex = Number.isInteger(index) ? index : null;
}

function currentSavedGames(){
  if(cloudUser) return dedupeGames(cloudGames);
  const cleaned = dedupeGames(getLocalGames());
  setLocalGames(cleaned);
  return cleaned;
}

function setStatus(html){
  const el = q("cloudSyncStatus");
  if(el) el.innerHTML = html;
}

async function loadCloudGames(){
  if(!cloudUser) return;
  setStatus("Wczytuję zapisane gry z chmury...");
  try{
    const ref = gamesCollection();
    const snap = await getDocs(query(ref, orderBy("savedAt", "desc")));
    const seen = new Set();
    const duplicatesToDelete = [];
    cloudGames = [];

    snap.docs.forEach(d => {
      const data = d.data();
      delete data._serverUpdatedAt;
      const game = { ...data, savedId: d.id };
      const fp = gameFingerprint(game);
      if(seen.has(fp)){
        duplicatesToDelete.push(d.id);
      }else{
        seen.add(fp);
        cloudGames.push(game);
      }
    });

    for(const duplicateId of duplicatesToDelete){
      await deleteDoc(doc(db, "users", cloudUser.uid, "games", duplicateId));
    }

    setLocalGames(cloudGames);
    cloudReady = true;
    setStatus("Zalogowano jako <strong>" + escapeHtml(cloudUser.email || "konto") + "</strong>. Gry są synchronizowane w chmurze.");
    window.renderSavedGames();
  }catch(e){
    cloudReady = false;
    setStatus("Nie udało się wczytać chmury. Sprawdź, czy baza Firestore jest włączona. Szczegóły: " + escapeHtml(e.message || String(e)));
    window.renderSavedGames();
  }
}

async function saveGameToCloud(game){
  if(!cloudUser) return;
  const ref = doc(db, "users", cloudUser.uid, "games", game.savedId);
  await setDoc(ref, { ...game, _serverUpdatedAt: serverTimestamp() }, { merge:true });
}

async function deleteGameFromCloud(game){
  if(!cloudUser || !game || !game.savedId) return;
  await deleteDoc(doc(db, "users", cloudUser.uid, "games", game.savedId));
}

async function syncLocalToCloud(){
  if(!cloudUser){
    showToast("Najpierw się zaloguj.");
    return;
  }
  const local = getLocalGames();
  if(!local.length){
    showToast("Brak lokalnych gier do przesłania.");
    return;
  }
  try{
    await loadCloudGames();
    const existing = new Set(cloudGames.map(gameFingerprint));
    for(const raw of local){
      const game = normalizeGameForSave(raw);
      const fp = gameFingerprint(game);
      if(existing.has(fp)) continue;
      existing.add(fp);
      await saveGameToCloud(game);
    }
    await loadCloudGames();
    showToast("Lokalne gry przesłane do chmury.");
  }catch(e){
    showToast("Nie udało się przesłać gier do chmury.");
    setStatus("Błąd synchronizacji: " + escapeHtml(e.message || String(e)));
  }
}

function ensureCloudSyncBox(){
  const savedList = q("savedList");
  if(!savedList || q("cloudSyncBox")) return;

  const box = document.createElement("div");
  box.id = "cloudSyncBox";
  box.className = "cloud-sync-box";
  box.innerHTML = `
    <div class="cloud-sync-row" id="cloudLoggedOut">
      <input id="cloudEmail" type="email" placeholder="E-mail" autocomplete="email">
      <input id="cloudPassword" type="password" placeholder="Hasło" autocomplete="current-password">
      <button class="btn small" type="button" id="cloudLoginBtn">Zaloguj</button>
      <button class="btn secondary small" type="button" id="cloudRegisterBtn">Utwórz konto</button>
    </div>
    <div class="cloud-sync-row" id="cloudLoggedIn" style="display:none;">
      <button class="btn secondary small" type="button" id="cloudSyncLocalBtn">Przenieś lokalne gry do chmury</button>
      <button class="btn secondary small" type="button" id="cloudRefreshBtn">Odśwież gry z chmury</button>
      <button class="btn red small" type="button" id="cloudLogoutBtn">Wyloguj</button>
    </div>
    <div class="cloud-sync-status" id="cloudSyncStatus">Nie jesteś zalogowany. Bez logowania gry zapisują się tylko lokalnie na tym urządzeniu.</div>
    <p class="cloud-sync-note">Po zalogowaniu tym samym kontem zobaczysz swoje zapisane gry na różnych urządzeniach.</p>
  `;

  savedList.parentNode.insertBefore(box, savedList);

  q("cloudLoginBtn").addEventListener("click", async function(){
    const email = q("cloudEmail").value.trim();
    const password = q("cloudPassword").value;
    if(!email || !password){
      showToast("Wpisz e-mail i hasło.");
      return;
    }
    try{
      await signInWithEmailAndPassword(auth, email, password);
      showToast("Zalogowano.");
    }catch(e){
      showToast("Nie udało się zalogować.");
      setStatus("Błąd logowania: " + escapeHtml(e.message || String(e)));
    }
  });

  q("cloudRegisterBtn").addEventListener("click", async function(){
    const email = q("cloudEmail").value.trim();
    const password = q("cloudPassword").value;
    if(!email || !password){
      showToast("Wpisz e-mail i hasło.");
      return;
    }
    if(password.length < 6){
      showToast("Hasło musi mieć co najmniej 6 znaków.");
      return;
    }
    try{
      await createUserWithEmailAndPassword(auth, email, password);
      showToast("Konto utworzone.");
    }catch(e){
      showToast("Nie udało się utworzyć konta.");
      setStatus("Błąd tworzenia konta: " + escapeHtml(e.message || String(e)));
    }
  });

  q("cloudLogoutBtn").addEventListener("click", async function(){
    await signOut(auth);
    showToast("Wylogowano.");
  });

  q("cloudRefreshBtn").addEventListener("click", loadCloudGames);
  q("cloudSyncLocalBtn").addEventListener("click", syncLocalToCloud);
}

function ensureSavedFilters(){
  const savedList = q("savedList");
  if(!savedList) return;

  let panel = q("savedFilterPanel");

  if(!panel){
    panel = document.createElement("div");
    panel.id = "savedFilterPanel";
    panel.className = "saved-filter-panel";
    panel.innerHTML = `
      <span class="saved-filter-panel-title">Filtry:</span>
      <input id="savedSearchInput" class="saved-search-box" type="search" placeholder="Szukaj po nazwie gry...">
      <button class="saved-filter-button active" type="button" data-filter="all">Wszystkie typy</button>
      <button class="saved-filter-button" type="button" data-filter="match">Łączenie w pary</button>
      <button class="saved-filter-button" type="button" data-filter="sort">Sortowanie</button>
      <button class="saved-filter-button" type="button" data-filter="quiz">Quiz</button>
      <button class="saved-filter-button" type="button" data-filter="memory">Memory</button>
      <button class="saved-filter-button" type="button" data-filter="puzzle">Puzzle</button>
      <button class="saved-filter-button" type="button" data-filter="safe">Sejf</button>
      <button class="saved-filter-button" type="button" data-filter="flying">Latające odpowiedzi</button>
      <button class="saved-filter-button" type="button" data-filter="training">Trening</button>
      <button class="saved-filter-button" type="button" data-filter="fraction-models">Modele ułamków</button>
      <button class="saved-filter-button" type="button" data-filter="connect4">4 w linii</button>
      <div class="saved-tag-filter-row">
        <span class="saved-filter-panel-title">Klasy:</span>
        <span id="savedTagButtonsBox"></span>
      </div>
    `;

    savedList.parentNode.insertBefore(panel, savedList);

    const search = q("savedSearchInput");
    search.value = savedSearchText;
    search.addEventListener("input", function(){
      savedSearchText = this.value.trim().toLowerCase();
      window.renderSavedGames();
    });

    panel.querySelectorAll("[data-filter]").forEach(function(btn){
      btn.addEventListener("click", function(){
        savedFilterType = btn.dataset.filter || "all";
        panel.querySelectorAll("[data-filter]").forEach(function(b){
          b.classList.toggle("active", b.dataset.filter === savedFilterType);
        });
        window.renderSavedGames();
      });
    });
  }

  panel.querySelectorAll("[data-filter]").forEach(function(btn){
    btn.classList.toggle("active", (btn.dataset.filter || "all") === savedFilterType);
  });

  const search = q("savedSearchInput");
  if(search && document.activeElement !== search){
    search.value = savedSearchText;
  }

  // Tagi/klasy muszą aktualizować się dynamicznie po zapisaniu nowej gry.
  // W poprzedniej wersji panel tworzył się raz, gdy jeszcze nie było tagów,
  // dlatego później pojawiał się komunikat „Brak tagów...” mimo że gry miały klasy.
  const box = q("savedTagButtonsBox");
  if(box){
    const allTags = allClassTagsFromGames();
    if(savedFilterTag !== "all" && !allTags.includes(savedFilterTag)){
      savedFilterTag = "all";
    }

    const buttonsHtml = [
      '<button class="saved-class-tag-button" type="button" data-tag-filter="all">Wszystkie klasy</button>'
    ].concat(allTags.map(function(tag){
      return '<button class="saved-class-tag-button" type="button" data-tag-filter="' + escapeHtml(tag) + '">' + escapeHtml(tag) + '</button>';
    })).join('');

    box.innerHTML = buttonsHtml;

    box.querySelectorAll("[data-tag-filter]").forEach(function(btn){
      btn.classList.toggle("active", (btn.dataset.tagFilter || "all") === savedFilterTag);
      btn.addEventListener("click", function(){
        savedFilterTag = btn.dataset.tagFilter || "all";
        box.querySelectorAll("[data-tag-filter]").forEach(function(b){
          b.classList.toggle("active", (b.dataset.tagFilter || "all") === savedFilterTag);
        });
        window.renderSavedGames();
      });
    });
  }
}
function gameMatchesSavedFilters(game){
  if(savedFilterType !== "all"){
    const gameType = game.type === "fractionModels" ? "fraction-models" : game.type;
    if(gameType !== savedFilterType) return false;
  }

  if(savedFilterTag !== "all"){
    const tags = normalizeTagList(game.classTags || game.tags);
    if(!tags.includes(savedFilterTag)) return false;
  }

  if(savedSearchText){
    const info = typeInfo(game);
    const tags = normalizeTagList(game.classTags || game.tags);
    const haystack = [
      game.title || "",
      info.typeLabel || "",
      info.count || "",
      tags.join(" ")
    ].join(" ").toLowerCase();
    if(!haystack.includes(savedSearchText)) return false;
  }

  return true;
}

function updateAuthUi(){
  ensureCloudSyncBox();

  const out = q("cloudLoggedOut");
  const inn = q("cloudLoggedIn");

  if(out) out.style.display = cloudUser ? "none" : "flex";
  if(inn) inn.style.display = cloudUser ? "flex" : "none";

  if(!cloudUser){
    cloudReady = false;
    cloudGames = [];
    setStatus("Nie jesteś zalogowany. Bez logowania gry zapisują się tylko lokalnie na tym urządzeniu.");
  }
}

function typeInfo(game){
  let typeLabel = "Gra";
  let count = "";

  if(game.type === "match"){
    typeLabel = "Łączenie w pary";
    count = (game.pairs ? game.pairs.length : 0) + " par";
  }else if(game.type === "sort"){
    typeLabel = "Sortowanie";
    const itemCount = game.items ? game.items.length : (game.categories || []).reduce(function(sum, cat){ return sum + ((cat.items || []).length); }, 0);
    count = itemCount + " elementów";
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
  }else if(game.type === "flying"){
    typeLabel = "Latające odpowiedzi";
    count = (game.questions ? game.questions.length : 0) + " pytań";
  }else if(game.type === "training"){
    typeLabel = "Trening";
    count = (game.questions ? game.questions.length : (game.tasks ? game.tasks.length : 0)) + " zadań";
  }else if(game.type === "fraction-models"){
    typeLabel = "Modele ułamków";
    count = (game.questions ? game.questions.length : (game.tasks ? game.tasks.length : 0)) + " zadań";
  }else if(game.type === "connect4"){
    typeLabel = "4 w linii";
    count = (game.tasks ? game.tasks.length : 0) + " przykładów";
  }

  return { typeLabel, count };
}

window.saveCurrentGame = async function(){
  if(saveInProgress) return;

  try{
    saveInProgress = true;

    const rawData = window.getCurrentGameData ? window.getCurrentGameData() : getCurrentGameData();
    const isEditing = !!editingGameId || editingGameIndex !== null;

    // Edycja ma zawsze NADPISAĆ istniejącą grę — także starsze lokalne zapisy,
    // które nie miały jeszcze savedId.
    if(isEditing){
      const savedNow = currentSavedGames();
      let editedSource = null;

      if(editingGameId){
        editedSource = savedNow.find(function(game){ return game.savedId === editingGameId; }) || null;
        rawData.savedId = editingGameId;
      }else if(editingGameIndex !== null && savedNow[editingGameIndex]){
        editedSource = savedNow[editingGameIndex];
        if(editedSource.savedId) rawData.savedId = editedSource.savedId;
      }

      if(editedSource && editedSource.savedAt) rawData.savedAt = editedSource.savedAt;
    }

    const fp = gameFingerprint(rawData);
    const now = Date.now();

    if(fp === lastSaveFingerprint && now - lastSaveTime < 1800){
      return;
    }

    lastSaveFingerprint = fp;
    lastSaveTime = now;

    // classTags/tags z formularza są źródłem prawdy.
    // Pusta tablica oznacza świadome usunięcie wszystkich tagów.
    const chosenTags = selectedClassTags();
    rawData.classTags = chosenTags.slice();
    rawData.tags = chosenTags.slice();

    const data = normalizeGameForSave(rawData);
    data.classTags = chosenTags.slice();
    data.tags = chosenTags.slice();

    if(cloudUser){
      await saveGameToCloud(data);
      await loadCloudGames();
      markGameAsEdited(data, null);
      showToast(isEditing ? "Zmiany zapisane w chmurze." : "Gra zapisana w chmurze.");
    }else{
      const localBefore = getLocalGames();
      let next;

      if(isEditing){
        let updated = false;

        if(editingGameId){
          next = localBefore.map(function(game){
            if(game.savedId === editingGameId){
              updated = true;
              return data;
            }
            return game;
          });
        }else{
          next = localBefore.slice();
        }

        if(!updated && editingGameIndex !== null && localBefore[editingGameIndex]){
          next[editingGameIndex] = data;
          updated = true;
        }

        if(!updated) next = [data].concat(localBefore);
      }else{
        const existingLocal = new Set(localBefore.map(gameFingerprint));
        next = existingLocal.has(gameFingerprint(data)) ? localBefore : [data].concat(localBefore);
      }

      setLocalGames(next);
      markGameAsEdited(data, editingGameIndex);
      showToast(isEditing ? "Zmiany zapisane na tym urządzeniu." : "Gra zapisana na tym urządzeniu. Zaloguj się, aby zapisać ją w chmurze.");
      window.renderSavedGames();
    }
  }catch(e){
    showToast(e.message || "Nie udało się zapisać gry.");
    setStatus("Błąd zapisu: " + escapeHtml(e.message || String(e)));
  }finally{
    setTimeout(function(){ saveInProgress = false; }, 250);
  }
};
window.renderSavedGames = function(){
  ensureCloudSyncBox();
  ensureSavedFilters();

  const box = q("savedList");
  if(!box) return;

  const allSaved = currentSavedGames();

  if(!allSaved.length){
    box.innerHTML = cloudUser
      ? "<p>Nie masz jeszcze zapisanych gier w chmurze.</p>"
      : "<p>Nie masz jeszcze zapisanych gier. Zaloguj się, aby je synchronizować.</p>";
    return;
  }

  const visibleGames = allSaved
    .map(function(game, index){ return { game, index }; })
    .filter(function(entry){ return gameMatchesSavedFilters(entry.game); });

  if(!visibleGames.length){
    box.innerHTML = '<div class="saved-no-results">Brak gier pasujących do wybranych filtrów.</div>';
    return;
  }

  box.innerHTML = "";

  visibleGames.forEach(function(entry){
    const game = entry.game;
    const index = entry.index;
    const item = document.createElement("div");
    item.className = "saved-game";
    if(game.type) item.dataset.gameType = game.type;

    const info = typeInfo(game);
    const classTags = normalizeTagList(game.classTags || game.tags);
    const tagHtml = classTags.length
      ? '<div class="saved-class-tags">' + classTags.map(function(tag){ return '<span class="saved-class-tag">' + escapeHtml(tag) + '</span>'; }).join('') + '</div>'
      : '';

    item.innerHTML = `
      <div>
        <span class="saved-type-badge">${escapeHtml(info.typeLabel)}</span>
        <strong>${escapeHtml(game.title || "Gra matematyczna")}</strong>
        ${tagHtml}
        <span class="small">${escapeHtml(info.count || "")}${cloudUser ? " · chmura" : " · zapis lokalny"}</span>
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
  const saved = currentSavedGames();
  const game = saved[index];
  if(!game) return;

  markGameAsEdited(game, index);

  q("gameTitle").value = game.title || "Gra matematyczna";
  q("gameType").value = game.type;
  setSelectedClassTags(game.classTags || game.tags || []);

  if(typeof onGameTypeChange === "function") onGameTypeChange();

  if(game.type === "match"){
    q("pairsInput").value = (game.pairs || []).map(function(p){
      return p.left + " ; " + p.right;
    }).join("\n");
  }else if(game.type === "sort" && q("sortInput")){
    q("sortInput").value = (game.categories || []).map(function(cat){
      return [cat.name].concat((cat.items || []).map(function(item){ return item.text || item; })).join(" ; ");
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

    if(game.image && q("puzzleImage")) q("puzzleImage").value = game.image;
    if(typeof markSelectedPuzzleImage === "function" && game.image) markSelectedPuzzleImage(game.image);
  }else if(game.type === "safe"){
    if(q("safeCodeLength")) q("safeCodeLength").value = String(game.codeLength || 4);
    q("safeInput").value = (game.tasks || []).map(function(t){
      return t.question + " ; " + t.answer + " ; " + (t.digit || "");
    }).join("\n");
  }else if(game.type === "flying" && q("flyingInput")){
    q("flyingInput").value = (game.questions || []).map(function(question){
      const wrong = (question.answers || []).filter(function(a){
        return a !== question.correct;
      }).slice(0,5);
      return [question.question, question.correct].concat(wrong).join(" ; ");
    }).join("\n");
  }else if(game.type === "training" && q("trainingInput")){
    q("trainingInput").value = (game.questions || game.tasks || []).map(function(t){
      return (t.question || t.left || "") + " ; " + (t.answer || t.correct || t.right || "");
    }).join("\n");
  }else if((game.type === "fraction-models" || game.type === "fractionModels") && q("fractionModelsInput")){
    q("fractionModelsInput").value = (game.questions || game.tasks || []).map(function(t){
      return (t.question || t.left || "") + " ; " + (t.answer || t.correct || t.right || "");
    }).join("\n");
  }

  showScreen("creator");
  buildGame(false);
};

window.playSavedGame = function(index){
  const saved = currentSavedGames();
  const game = saved[index];
  if(game) openFullscreen(game);
};

window.deleteSavedGame = async function(index){
  const saved = currentSavedGames();
  const game = saved[index];
  if(!game) return;

  if(!confirm("Usunąć tę grę?")) return;

  try{
    if(cloudUser){
      await deleteGameFromCloud(game);
      await loadCloudGames();
      showToast("Gra usunięta z chmury.");
    }else{
      saved.splice(index, 1);
      setLocalGames(saved);
      window.renderSavedGames();
      showToast("Gra usunięta.");
    }
  }catch(e){
    showToast("Nie udało się usunąć gry.");
    setStatus("Błąd usuwania: " + escapeHtml(e.message || String(e)));
  }
};

onAuthStateChanged(auth, async function(user){
  cloudUser = user;
  updateAuthUi();
  if(user){
    await loadCloudGames();
  }else{
    window.renderSavedGames();
  }
});

document.addEventListener("DOMContentLoaded", function(){
  ensureCloudSyncBox();
  updateAuthUi();

  const saveBtn = q("saveBtn");
  const navSaved = q("navSaved");

  if(saveBtn){
    // Usuwamy wcześniejsze nasłuchiwacze z podstawowego skryptu, bo powodowały podwójny zapis.
    const cleanSaveBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(cleanSaveBtn, saveBtn);
    cleanSaveBtn.addEventListener("click", function(e){
      e.preventDefault();
      e.stopImmediatePropagation();
      window.saveCurrentGame();
    });
  }

  if(navSaved){
    navSaved.onclick = function(e){
      e.preventDefault();
      showScreen("saved");
      window.renderSavedGames();
    };
  }

  const navCreator = q("navCreator");
  if(navCreator){
    navCreator.onclick = function(e){
      e.preventDefault();
      if(typeof clearEditingState === "function") clearEditingState();
      showScreen("start");
    };
  }

  setLocalGames(getLocalGames());
  window.renderSavedGames();
});
