
(function(){
  function q(id){ return document.getElementById(id); }
  function selectedClassTags(){
    return Array.from(document.querySelectorAll('#classTagsBox input[type="checkbox"]:checked')).map(function(input){ return input.value; });
  }
  function attachTagsWrapper(){
    if(window.__classTagsWrapperAttached) return;
    if(typeof window.getCurrentGameData !== 'function') return;
    window.__classTagsWrapperAttached = true;
    const originalGetCurrentGameData = window.getCurrentGameData;
    window.getCurrentGameData = function(){
      const game = originalGetCurrentGameData.apply(this, arguments);
      game.classTags = selectedClassTags();
      game.tags = game.classTags;
      return game;
    };
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', attachTagsWrapper);
  }else{
    attachTagsWrapper();
  }
})();
