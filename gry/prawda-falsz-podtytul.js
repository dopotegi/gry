
(function(){
  const prevRender = window.renderGame;
  if(!window.__tfSubtitleFixV2){
    window.__tfSubtitleFixV2 = true;
    window.renderGame = function(data, container, isFullscreen){
      const result = prevRender.apply(this, arguments);
      if(data && data.type === 'truefalse'){
        const sub = document.getElementById('fullscreenSubtitle');
        if(sub) sub.textContent = 'prawda / fałsz';
      }
      return result;
    };
  }
})();
