# Nowe tryby HTML — kontrakt projektu

Obecne 12 trybów zachowuje istniejące moduły. Dodatkowe tryby ładowane są z root tryby.js (window.DO_POTEGI_TRYBY). Nowe tryby powinny używać wyłącznie wspolne/tryby-html.js i wspolne/tryb-html.js jako interfejsu wspólnego zapisu, bez nowych nadpisań w starych modułach.

## Dodawanie

Zwróć użytkowniczce dwa pliki: kompletny HTML nowego trybu i kompletny tryby.js. Zawsze odczytaj obecną listę z jej repozytorium; nie zastępuj jej pojedynczym nowym wpisem. Nie zmieniaj index.html ani Firebase przy dodaniu zwykłego trybu zgodnego z adapterem.

Wpis listy: {id:'stabilny-identyfikator',name:'Nazwa',file:'nazwa-pliku.html',description:'Opis'}. Id jest stałe przez całe życie trybu. Nazwy plików używają ASCII, myślników, podkreśleń. Pliki najłatwiej umieszczać w root, obok index.html. Listę ładuje statyczny skrypt, bez fetch i konfiguracji serwera. Prefiks typu danych to html:IDENTYFIKATOR.

## HTML i adapter

HTML zawiera własny styl, własną mechanikę i własny formularz ustawień. W root dołącz <script src="wspolne/tryb-html.js"></script>. MathJax dołącz niezależnie, bo dokument iframe ma własny kontekst. Nie umieszczaj w dziecku logowania ani własnych kluczy localStorage dla zestawów, nie duplikuj tytułu/tagów/zapisu z hosta.

DoPotegiTryb.register(context => ...): context.mode to edit lub play, context.payload to zapisane dane (null dla nowego zestawu), context.title to tytuł hosta; play otrzymuje też fullscreen.

W edit renderuj własne ustawienia. Po KAŻDEJ zmianie oraz przy pierwszym uruchomieniu wywołaj DoPotegiTryb.changed(payload,{valid:true/false,error:'Tekst walidacji',count:'12 zadań'}). Dane muszą być obiektem serializowalnym do JSON. Dla niekompletnych danych wyślij valid:false. Adapter nie udostępnia osobnego zapisu: host czyta ostatnie zwalidowane dane i używa tego samego przycisku „Zapisz grę” oraz wspólnego magazynu.

W play renderuj mechanikę z context.payload. Nie modyfikuj oryginalnego zapisu i nie przesyłaj zmian edytora. DoPotegiTryb.typeset(element) obsługuje MathJax; DoPotegiTryb.toast(message) pokazuje komunikat hosta.

Host sprawdza origin i źródłową ramkę wiadomości. Nowy tryb jest kodem własnym autora uruchamianym w tej samej domenie, nie sandboxem dla obcego, niezaufanego HTML.

Zapis: {type:'html:id',title,htmlMode:{id,name,file,version:1},modePayload:{...},modeCount:'...',classTags:[...],tags:[...],savedId,savedAt,updatedAt}. Firebase przechowuje pełny obiekt dotychczasową ścieżką. Przy edycji zachowuje savedId. Brak trybu na liście nie usuwa zapisów; host pokazuje informację o przywróceniu plików.

W pliku HTML stosuj własne schema/version w payload i migruj stare dane przed użyciem. Nie zmieniaj id przy zmianie nazwy wyświetlanej ani nie usuwaj obsługi dotychczasowych danych. Rozmiar payload powinien pozostawać mały: Firebase ma limit rozmiaru dokumentu; nie zapisuj dużych grafik base64.

## Walidacja

Testować: dodanie na liście, formularz, walidację błędnych ustawień, podgląd, pełny ekran, lokalny zapis, tytuły/tagi, edycję bez duplikatu, usunięcie tagów, odświeżenie/odtworzenie, wyszukiwanie/filtr, zapis i edycję przez wspólną ścieżkę Firebase. Po aktualizacji schematu testować zestaw sprzed zmiany.

W tej wersji: wszystkie 12 oryginalnych trybów porównano ze źródłem w Chromium przy stałym ziarnie losowości. Nowy adapter przetestowano przez przyklad-trybu.html i listę testową podawaną w przechwyceniu HTTP, bez aktywowania przykładu w produkcyjnym tryby.js. Firebase zastąpiono testowymi modułami, sprawdzając lokalny zapis i aktualizację, oraz chmurowy setDoc/getDocs z pełnym payload i zachowaniem tożsamości. Rzeczywiste konto i reguły Firestore nie zostały zweryfikowane.

wersja-poprzednia.html pozostaje dokładną kopią monolitu pobranego 14.10.2026. Można przywrócić ją jako index.html.
