
(function(){

  function normalizeBackslashes(value){
    return String(value || "").replace(/\\\\/g, "\\").trim();
  }

  function hasTextOutsideMath(value){
    let s = normalizeBackslashes(value);

    // usuń komendy LaTeX, żeby ich litery nie były traktowane jako tekst
    s = s.replace(/\\[a-zA-Z]+/g, "");

    // usuń liczby, operatory, nawiasy, klamry i znaki techniczne
    s = s.replace(/[0-9\s{}\[\]()+\-*/:=,.<>|^_]/g, "");

    return /[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(s);
  }

  function looksLikeMath(value){
    const v = normalizeBackslashes(value);
    return /\\[a-zA-Z]+|[\^_=]|[0-9]\s*[+\-*/:]|\\frac|\\sqrt|\\cdot|\\times|\\div/.test(v);
  }

  function protectMathParts(value){
    let v = normalizeBackslashes(value);
    const placeholders = [];

    function protect(regex){
      v = v.replace(regex, function(match){
        const trimmed = match.trim();
        if(!looksLikeMath(trimmed)) return match;
        const key = "%%MATH_" + placeholders.length + "%%";
        placeholders.push(trimmed);
        return key;
      });
    }

    protect(/\\d?frac\{[^{}]+\}\{[^{}]+\}/g);
    protect(/\\sqrt\{[^{}]+\}/g);
    protect(/[0-9a-zA-Z]+(?:\^\{[^{}]+\}|\^[0-9a-zA-Z]+)?\s*(?:\\cdot|\\times|\\div|[+\-*/:])\s*[0-9a-zA-Z]+(?:\^\{[^{}]+\}|\^[0-9a-zA-Z]+)?/g);
    protect(/[0-9a-zA-Z]+(?:\{[^{}]+\})?\^\{?[^{}\s]+\}?/g);

    let out = escapeHtml(v);

    placeholders.forEach(function(math, i){
      out = out.replaceAll("%%MATH_" + i + "%%", "\\(" + math + "\\)");
    });

    return out;
  }

  window.renderMixed = function(value){
    const v = normalizeBackslashes(value);
    if(!v) return "";

    if(v.includes("\\(") || v.includes("\\[") || v.includes("$")){
      return v;
    }

    // czysty przykład matematyczny renderujemy jako jeden wzór
    if(looksLikeMath(v) && !hasTextOutsideMath(v)){
      return "\\(" + v + "\\)";
    }

    // zdanie z fragmentami matematycznymi
    return protectMathParts(v);
  };

})();
