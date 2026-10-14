# Utrzymanie projektu

Źródło: https://dopotegi.github.io/gry/, pobrane 14.10.2026.

Jest to zachowawcza migracja istniejącego index.html. Wszystkie oryginalne bloki JS i CSS zachowano, wraz z kolejnością skryptów, identyfikatorami, selektorami, kluczami localStorage i konfiguracją Firebase. Bazowe renderery par, sejfu, quizu, memory i puzzle wydzielono z podstawy. Logo wyodrębniono bez zmiany bajtów.

Nie traktować tej wersji jako nowego systemu niezależnych wtyczek. Rozszerzenia nadal opakowują wspólne funkcje. Przy poprawce gry przeczytać jej pliki oraz związane rozszerzenia. Nie dodawać kolejnych przypadkowych nadpisań do index.html. Przy nowym trybie dodać jego plik, wymagane formularze/menu i obsługę zapisu. Dalsze usuwanie łańcuchów nadpisań wymaga odrębnej migracji i testów.

Pliki gry/*.js zawierają mechanikę poszczególnych trybów. wspolne/podstawa.js zawiera formularze, bazowe parsowanie danych, przełączanie ekranów i funkcje wspólne. wspolne/firebase.js zawiera synchronizację, bibliotekę i obsługę edycji. wspolne/wyglad-*.css odpowiadają oryginalnym blokom CSS w kolejności występowania. Nie zmieniać kolejności ładowania bez sprawdzenia zależności.

wersja-poprzednia.html jest dokładną kopią źródła i umożliwia przywrócenie przez zmianę nazwy na index.html. Nie włączać jej jako zależności nowej aplikacji.

Walidacja: składnia klasycznych skryptów Node vm; porównanie starej i nowej aplikacji w Chromium z jednakowym ziarnem losowości, odciętymi usługami zewnętrznymi, przełączanie wszystkich 12 typów, budowanie podglądów i pełnego ekranu. Wyniki tekstowe i widoczność formularzy identyczne; brak błędów pageerror. Firebase i MathJax wymagają kontroli w środowisku docelowym.
