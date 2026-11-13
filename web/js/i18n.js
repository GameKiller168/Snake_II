/* Localized phone labels, firmware font-pack selection, and browser-language detection. */
(function () {
  'use strict';

  var NS = (globalThis.SnakeII = globalThis.SnakeII || {});
  var req = typeof require === 'function';
  var English = NS.Texts || (req ? require('./texts.js') : {});
  var LANGUAGES = [
    { code: 'en', name: 'English' }, { code: 'hu', name: 'Magyar' }, { code: 'ro', name: 'Română' },
    { code: 'de', name: 'Deutsch' }, { code: 'sk', name: 'Slovenčina' }, { code: 'pl', name: 'Polski' },
    { code: 'fr', name: 'Français' }, { code: 'es', name: 'Español' },
    { code: 'ar', name: 'العربية' }, { code: 'zh-cn', name: '简体中文' }, { code: 'zh-tw', name: '繁體中文' },
    { code: 'hr', name: 'Hrvatski' }, { code: 'cs', name: 'Čeština' }, { code: 'da', name: 'Dansk' },
    { code: 'nl', name: 'Nederlands' }, { code: 'et', name: 'Eesti' }, { code: 'fi', name: 'Suomi' },
    { code: 'it', name: 'Italiano' }, { code: 'el', name: 'Ελληνικά' }, { code: 'he', name: 'עברית' },
    { code: 'hi', name: 'हिन्दी' }, { code: 'id', name: 'Bahasa Indonesia' }, { code: 'lv', name: 'Latviešu' },
    { code: 'lt', name: 'Lietuvių' }, { code: 'ms', name: 'Bahasa Melayu' }, { code: 'no', name: 'Norsk' },
    { code: 'pt', name: 'Português' }, { code: 'ru', name: 'Русский' }, { code: 'sr', name: 'Српски' },
    { code: 'sl', name: 'Slovenščina' }, { code: 'sv', name: 'Svenska' }, { code: 'tl', name: 'Filipino' },
    { code: 'th', name: 'ไทย' }, { code: 'tr', name: 'Türkçe' }, { code: 'uk', name: 'Українська' }, { code: 'vi', name: 'Tiếng Việt' }
  ];

  var FONT_PACKS = {
    en: 'B', de: 'B', fr: 'B', it: 'B', nl: 'B', es: 'C', pt: 'C', el: 'C',
    hu: 'D', ru: 'D', hr: 'D', ro: 'D', sr: 'D', sl: 'D', uk: 'E',
    sv: 'A', da: 'A', no: 'A', fi: 'A', tr: 'A', ar: 'I', he: 'I',
    'zh-tw': 'B', 'zh-cn': 'B', tl: 'B', id: 'B', ms: 'B', vi: 'B', th: 'B', hi: 'B',
    sk: 'J', pl: 'J', et: 'J', lv: 'J', lt: 'J', cs: 'J'
  };

  var PACKS = {
    en: {
      OPTIONS: 'Options', GAME_SOUNDS: 'Game sound', KEY_TONES: 'Key tone', VIBRATION: 'Vibration', LANGUAGE: 'Language',
      YOU_WON: 'YOU WON!', ON: 'On', OFF: 'Off', SYSTEM: 'System', KEYS: 'Keys', DISPLAY: 'Display of the game', SCROLL_UP: 'Scroll up',
      SCROLL_DOWN: 'Scroll down', BUTTON_SELECT: 'Select', KEYBOARD_HELP: 'Keyboard: arrows or 2 4 6 8 steer the snake, Enter = Select, Backspace = C, up / down arrows scroll the menu.'
    },
    hu: {
      NEW_GAME: 'Új játék', CONTINUE: 'Folytatás', LEVEL: 'Szint', MAZES: 'Labirintusok', TOP_SCORE: 'Rekord', INSTRUCTIONS: 'Útmutató',
      SELECT: 'Választ', OK: 'OK', NEXT: 'Tovább', LEVEL_LABEL: 'Szint:',
      MAZE_NAMES: ['Labirintus nélkül', 'Lab. 1', 'Lab. 2', 'Lab. 3', 'Lab. 4', 'Lab. 5'], SELECTED: '%U kiválasztva',
      TOP_SCORE_NOTE: 'Rekord:\n%N', GAME_OVER_TOP: 'Játék vége!\nREKORD:\n%N', GAME_OVER_SCORE: 'Játék vége!\nPontszám:\n%N',
      INSTRUCTION_TEXT: 'Növeld a kígyó hosszát az étel felé irányítva. A 2, 4, 6 és 8 gombbal fordulhatsz. Nem állhatsz meg és nem mehetsz visszafelé. Kerüld el a falakat és a farkat.',
      YOU_WON: 'NYERTÉL!', OPTIONS: 'Beállítások', GAME_SOUNDS: 'Játékhang', KEY_TONES: 'Gombhang', VIBRATION: 'Rezgés', LANGUAGE: 'Nyelv', ON: 'Be', OFF: 'Ki', SYSTEM: 'Rendszer',
      KEYS: 'Gombok', DISPLAY: 'Játék kijelzője', SCROLL_UP: 'Görgetés fel', SCROLL_DOWN: 'Görgetés le', BUTTON_SELECT: 'Kiválasztás',
      KEYBOARD_HELP: 'Billentyűzet: nyilak vagy 2 4 6 8 = irányítás, Enter = kiválasztás, Backspace = C, fel / le = görgetés.'
    },
    ro: {
      NEW_GAME: 'Joc nou', CONTINUE: 'Continuă', LEVEL: 'Nivel', MAZES: 'Labirinturi', TOP_SCORE: 'Scor maxim', INSTRUCTIONS: 'Instrucțiuni',
      SELECT: 'Selectează', OK: 'OK', NEXT: 'Înainte', LEVEL_LABEL: 'Nivel:',
      MAZE_NAMES: ['Fără labirint', 'Lab. 1', 'Lab. 2', 'Lab. 3', 'Lab. 4', 'Lab. 5'], SELECTED: '%U selectat',
      TOP_SCORE_NOTE: 'Scor maxim:\n%N', GAME_OVER_TOP: 'Joc încheiat!\nSCOR MAXIM:\n%N', GAME_OVER_SCORE: 'Joc încheiat!\nScorul tău:\n%N',
      INSTRUCTION_TEXT: 'Crește șarpele îndreptându-l spre hrană. Folosește tastele 2, 4, 6 și 8. Nu poți opri șarpele sau merge înapoi. Ferește-te de pereți și de coadă.',
      YOU_WON: 'AI CÂȘTIGAT!', OPTIONS: 'Opțiuni', GAME_SOUNDS: 'Sunet joc', KEY_TONES: 'Ton taste', VIBRATION: 'Vibrații', LANGUAGE: 'Limbă', ON: 'Da', OFF: 'Nu', SYSTEM: 'Sistem',
      KEYS: 'Taste', DISPLAY: 'Ecranul jocului', SCROLL_UP: 'Derulează sus', SCROLL_DOWN: 'Derulează jos', BUTTON_SELECT: 'Selectează',
      KEYBOARD_HELP: 'Tastatură: săgețile sau 2 4 6 8 controlează șarpele, Enter = selectare, Backspace = C, sus / jos = derulare.'
    },
    de: {
      NEW_GAME: 'Neues Spiel', CONTINUE: 'Fortsetzen', LEVEL: 'Level', MAZES: 'Labyrinthe', TOP_SCORE: 'Rekord', INSTRUCTIONS: 'Anleitung',
      SELECT: 'Wählen', OK: 'OK', NEXT: 'Weiter', LEVEL_LABEL: 'Level:',
      MAZE_NAMES: ['Ohne Labyrinth', 'Lab. 1', 'Lab. 2', 'Lab. 3', 'Lab. 4', 'Lab. 5'], SELECTED: '%U gewählt',
      TOP_SCORE_NOTE: 'Rekord:\n%N', GAME_OVER_TOP: 'Spiel vorbei!\nREKORD:\n%N', GAME_OVER_SCORE: 'Spiel vorbei!\nPunktzahl:\n%N',
      INSTRUCTION_TEXT: 'Führe die Schlange zum Futter, damit sie wächst. Steuere mit den Tasten 2, 4, 6 und 8. Anhalten und Umkehren geht nicht. Meide Wände und Schwanz.',
      YOU_WON: 'DU HAST GEWONNEN!', OPTIONS: 'Optionen', GAME_SOUNDS: 'Spielton', KEY_TONES: 'Tastenton', VIBRATION: 'Vibration', LANGUAGE: 'Sprache', ON: 'Ein', OFF: 'Aus', SYSTEM: 'System',
      KEYS: 'Tasten', DISPLAY: 'Spielanzeige', SCROLL_UP: 'Nach oben', SCROLL_DOWN: 'Nach unten', BUTTON_SELECT: 'Wählen',
      KEYBOARD_HELP: 'Tastatur: Pfeile oder 2 4 6 8 steuern die Schlange, Enter = Wählen, Backspace = C, hoch / runter = Menü.'
    },
    sk: {
      NEW_GAME: 'Nová hra', CONTINUE: 'Pokračovať', LEVEL: 'Úroveň', MAZES: 'Bludiská', TOP_SCORE: 'Rekord', INSTRUCTIONS: 'Návod',
      SELECT: 'Vybrať', OK: 'OK', NEXT: 'Ďalej', LEVEL_LABEL: 'Úroveň:',
      MAZE_NAMES: ['Bez bludiska', 'Blud. 1', 'Blud. 2', 'Blud. 3', 'Blud. 4', 'Blud. 5'], SELECTED: '%U vybrané',
      TOP_SCORE_NOTE: 'Rekord:\n%N', GAME_OVER_TOP: 'Koniec hry!\nREKORD:\n%N', GAME_OVER_SCORE: 'Koniec hry!\nSkóre:\n%N',
      INSTRUCTION_TEXT: 'Veď hada k jedlu, aby rástol. Použi klávesy 2, 4, 6 a 8. Had sa nedá zastaviť ani otočiť späť. Vyhýbaj sa stenám a chvostu.',
      YOU_WON: 'VYHRAL SI!', OPTIONS: 'Možnosti', GAME_SOUNDS: 'Zvuk hry', KEY_TONES: 'Tóny', VIBRATION: 'Vibrácie', LANGUAGE: 'Jazyk', ON: 'Zap', OFF: 'Vyp', SYSTEM: 'Systém',
      KEYS: 'Klávesy', DISPLAY: 'Displej hry', SCROLL_UP: 'Posun hore', SCROLL_DOWN: 'Posun dolu', BUTTON_SELECT: 'Vybrať',
      KEYBOARD_HELP: 'Klávesnica: šípky alebo 2 4 6 8 riadia hada, Enter = vybrať, Backspace = C, hore / dolu = posun.'
    },
    pl: {
      NEW_GAME: 'Nowa gra', CONTINUE: 'Kontynuuj', LEVEL: 'Poziom', MAZES: 'Labirynty', TOP_SCORE: 'Rekord', INSTRUCTIONS: 'Instrukcja',
      SELECT: 'Wybierz', OK: 'OK', NEXT: 'Dalej', LEVEL_LABEL: 'Poziom:',
      MAZE_NAMES: ['Bez labiryntu', 'Lab. 1', 'Lab. 2', 'Lab. 3', 'Lab. 4', 'Lab. 5'], SELECTED: 'Wybrano: %U',
      TOP_SCORE_NOTE: 'Rekord:\n%N', GAME_OVER_TOP: 'Koniec gry!\nREKORD:\n%N', GAME_OVER_SCORE: 'Koniec gry!\nTwój wynik:\n%N',
      INSTRUCTION_TEXT: 'Prowadź węża do jedzenia, aby rósł. Używaj klawiszy 2, 4, 6 i 8. Wąż nie może się zatrzymać ani cofnąć. Unikaj ścian i ogona.',
      YOU_WON: 'WYGRAŁEŚ!', OPTIONS: 'Opcje', GAME_SOUNDS: 'Dźwięk gry', KEY_TONES: 'Klawisze', VIBRATION: 'Wibracje', LANGUAGE: 'Język', ON: 'Wł.', OFF: 'Wył.', SYSTEM: 'System',
      KEYS: 'Klawisze', DISPLAY: 'Ekran gry', SCROLL_UP: 'Przewiń w górę', SCROLL_DOWN: 'Przewiń w dół', BUTTON_SELECT: 'Wybierz',
      KEYBOARD_HELP: 'Klawiatura: strzałki lub 2 4 6 8 sterują wężem, Enter = wybór, Backspace = C, góra / dół = przewijanie.'
    },
    fr: {
      NEW_GAME: 'Nouvelle partie', CONTINUE: 'Continuer', LEVEL: 'Niveau', MAZES: 'Labyrinthes', TOP_SCORE: 'Record', INSTRUCTIONS: 'Instructions',
      SELECT: 'Choisir', OK: 'OK', NEXT: 'Suivant', LEVEL_LABEL: 'Niveau :',
      MAZE_NAMES: ['Sans labyrinthe', 'Lab. 1', 'Lab. 2', 'Lab. 3', 'Lab. 4', 'Lab. 5'], SELECTED: '%U choisi',
      TOP_SCORE_NOTE: 'Record :\n%N', GAME_OVER_TOP: 'Fin de partie !\nRECORD :\n%N', GAME_OVER_SCORE: 'Fin de partie !\nVotre score :\n%N',
      INSTRUCTION_TEXT: 'Faites grandir le serpent en le dirigeant vers la nourriture. Utilisez les touches 2, 4, 6 et 8. Il ne peut ni s’arrêter ni reculer. Évitez les murs et la queue.',
      YOU_WON: 'VOUS AVEZ GAGNÉ !', OPTIONS: 'Options', GAME_SOUNDS: 'Son du jeu', KEY_TONES: 'Tonalités', VIBRATION: 'Vibration', LANGUAGE: 'Langue', ON: 'Oui', OFF: 'Non', SYSTEM: 'Système',
      KEYS: 'Touches', DISPLAY: 'Écran du jeu', SCROLL_UP: 'Défiler vers le haut', SCROLL_DOWN: 'Défiler vers le bas', BUTTON_SELECT: 'Choisir',
      KEYBOARD_HELP: 'Clavier : flèches ou 2 4 6 8 pour diriger, Entrée = choisir, Retour arrière = C, haut / bas = défiler.'
    },
    es: {
      NEW_GAME: 'Juego nuevo', CONTINUE: 'Continuar', LEVEL: 'Nivel', MAZES: 'Laberintos', TOP_SCORE: 'Récord', INSTRUCTIONS: 'Instrucciones',
      SELECT: 'Elegir', OK: 'OK', NEXT: 'Siguiente', LEVEL_LABEL: 'Nivel:',
      MAZE_NAMES: ['Sin laberinto', 'Lab. 1', 'Lab. 2', 'Lab. 3', 'Lab. 4', 'Lab. 5'], SELECTED: '%U elegido',
      TOP_SCORE_NOTE: 'Récord:\n%N', GAME_OVER_TOP: 'Fin del juego\nRÉCORD:\n%N', GAME_OVER_SCORE: 'Fin del juego\nPuntuación:\n%N',
      INSTRUCTION_TEXT: 'Haz crecer la serpiente dirigiéndola hacia la comida. Usa las teclas 2, 4, 6 y 8. No puede parar ni retroceder. Evita las paredes y la cola.',
      YOU_WON: '¡HAS GANADO!', OPTIONS: 'Opciones', GAME_SOUNDS: 'Sonido', KEY_TONES: 'Teclas', VIBRATION: 'Vibración', LANGUAGE: 'Idioma', ON: 'Sí', OFF: 'No', SYSTEM: 'Sistema',
      KEYS: 'Teclas', DISPLAY: 'Pantalla del juego', SCROLL_UP: 'Subir', SCROLL_DOWN: 'Bajar', BUTTON_SELECT: 'Elegir',
      KEYBOARD_HELP: 'Teclado: flechas o 2 4 6 8 mueven la serpiente, Intro = elegir, Retroceso = C, arriba / abajo = menú.'
    }
  };

  // The v6.39 PPM chart lists these additional menu languages. The main menu uses short labels to fit the 84 px LCD.
  var MENU_KEYS = [
    'NEW_GAME', 'CONTINUE', 'LEVEL', 'MAZES', 'TOP_SCORE', 'INSTRUCTIONS', 'OPTIONS', 'GAME_SOUNDS', 'KEY_TONES',
    'VIBRATION', 'LANGUAGE', 'ON', 'OFF', 'SYSTEM', 'SELECT', 'OK', 'NEXT', 'SELECTED', 'MAZE_NAMES'
  ];
  var MENU_TRANSLATIONS = {
    sv: { NEW_GAME: 'Nytt spel', CONTINUE: 'Fortsätt', LEVEL: 'Nivå', MAZES: 'Labyrinter', TOP_SCORE: 'Rekord', INSTRUCTIONS: 'Instruktion', OPTIONS: 'Inställningar', GAME_SOUNDS: 'Ljud', KEY_TONES: 'Knapp', VIBRATION: 'Vibr.', LANGUAGE: 'Språk', ON: 'På', OFF: 'Av', SYSTEM: 'System', SELECT: 'Välj', OK: 'OK', NEXT: 'Nästa', SELECTED: '%U valt', MAZE_NAMES: ['Utan labyrint', 'Lab. 1', 'Lab. 2', 'Lab. 3', 'Lab. 4', 'Lab. 5'] },
    da: { NEW_GAME: 'Nyt spil', CONTINUE: 'Fortsæt', LEVEL: 'Niveau', MAZES: 'Labyrinter', TOP_SCORE: 'Rekord', INSTRUCTIONS: 'Vejledning', OPTIONS: 'Indstillinger', GAME_SOUNDS: 'Lyd', KEY_TONES: 'Tast', VIBRATION: 'Vibr.', LANGUAGE: 'Sprog', ON: 'Til', OFF: 'Fra', SYSTEM: 'System', SELECT: 'Vælg', OK: 'OK', NEXT: 'Næste', SELECTED: '%U valgt', MAZE_NAMES: ['Uden labyrint', 'Lab. 1', 'Lab. 2', 'Lab. 3', 'Lab. 4', 'Lab. 5'] },
    no: { NEW_GAME: 'Nytt spill', CONTINUE: 'Fortsett', LEVEL: 'Nivå', MAZES: 'Labyrinter', TOP_SCORE: 'Rekord', INSTRUCTIONS: 'Instruksjon', OPTIONS: 'Innstillinger', GAME_SOUNDS: 'Lyd', KEY_TONES: 'Tast', VIBRATION: 'Vibr.', LANGUAGE: 'Språk', ON: 'På', OFF: 'Av', SYSTEM: 'System', SELECT: 'Velg', OK: 'OK', NEXT: 'Neste', SELECTED: '%U valgt', MAZE_NAMES: ['Uten labyrint', 'Lab. 1', 'Lab. 2', 'Lab. 3', 'Lab. 4', 'Lab. 5'] },
    fi: { NEW_GAME: 'Uusi peli', CONTINUE: 'Jatka', LEVEL: 'Taso', MAZES: 'Labyrintit', TOP_SCORE: 'Ennätys', INSTRUCTIONS: 'Ohjeet', OPTIONS: 'Asetukset', GAME_SOUNDS: 'Ääni', KEY_TONES: 'Näpp.', VIBRATION: 'Värinä', LANGUAGE: 'Kieli', ON: 'Päällä', OFF: 'Pois', SYSTEM: 'Järjestelmä', SELECT: 'Valitse', OK: 'OK', NEXT: 'Seuraava', SELECTED: '%U valittu', MAZE_NAMES: ['Ei labyrinttia', 'Lab. 1', 'Lab. 2', 'Lab. 3', 'Lab. 4', 'Lab. 5'] },
    tr: { NEW_GAME: 'Yeni oyun', CONTINUE: 'Devam et', LEVEL: 'Seviye', MAZES: 'Labirentler', TOP_SCORE: 'Rekor', INSTRUCTIONS: 'Yardım', OPTIONS: 'Ayarlar', GAME_SOUNDS: 'Ses', KEY_TONES: 'Tuş', VIBRATION: 'Titreş.', LANGUAGE: 'Dil', ON: 'Açık', OFF: 'Kapalı', SYSTEM: 'Sistem', SELECT: 'Seç', OK: 'OK', NEXT: 'Sonraki', SELECTED: '%U seçildi', MAZE_NAMES: ['Labirent yok', 'Lab. 1', 'Lab. 2', 'Lab. 3', 'Lab. 4', 'Lab. 5'] },
    it: { NEW_GAME: 'Nuova partita', CONTINUE: 'Continua', LEVEL: 'Livello', MAZES: 'Labirinti', TOP_SCORE: 'Record', INSTRUCTIONS: 'Istruzioni', OPTIONS: 'Opzioni', GAME_SOUNDS: 'Audio', KEY_TONES: 'Tasti', VIBRATION: 'Vibra', LANGUAGE: 'Lingua', ON: 'Attivo', OFF: 'Spento', SYSTEM: 'Sistema', SELECT: 'Scegli', OK: 'OK', NEXT: 'Avanti', SELECTED: '%U selezionato', MAZE_NAMES: ['Senza labirinto', 'Lab. 1', 'Lab. 2', 'Lab. 3', 'Lab. 4', 'Lab. 5'] },
    nl: { NEW_GAME: 'Nieuw spel', CONTINUE: 'Doorgaan', LEVEL: 'Niveau', MAZES: 'Doolhoven', TOP_SCORE: 'Topscore', INSTRUCTIONS: 'Instructies', OPTIONS: 'Opties', GAME_SOUNDS: 'Geluid', KEY_TONES: 'Toets', VIBRATION: 'Tril', LANGUAGE: 'Taal', ON: 'Aan', OFF: 'Uit', SYSTEM: 'Systeem', SELECT: 'Kies', OK: 'OK', NEXT: 'Volgende', SELECTED: '%U gekozen', MAZE_NAMES: ['Geen doolhof', 'Doolh. 1', 'Doolh. 2', 'Doolh. 3', 'Doolh. 4', 'Doolh. 5'] },
    pt: { NEW_GAME: 'Novo jogo', CONTINUE: 'Continuar', LEVEL: 'Nível', MAZES: 'Labirintos', TOP_SCORE: 'Recorde', INSTRUCTIONS: 'Instruções', OPTIONS: 'Opções', GAME_SOUNDS: 'Som', KEY_TONES: 'Teclas', VIBRATION: 'Vibra.', LANGUAGE: 'Idioma', ON: 'Ativo', OFF: 'Inat.', SYSTEM: 'Sistema', SELECT: 'Escolher', OK: 'OK', NEXT: 'Próximo', SELECTED: '%U selecionado', MAZE_NAMES: ['Sem labirinto', 'Lab. 1', 'Lab. 2', 'Lab. 3', 'Lab. 4', 'Lab. 5'] },
    el: { NEW_GAME: 'Νέο παιχνίδι', CONTINUE: 'Συνέχεια', LEVEL: 'Επίπεδο', MAZES: 'Λαβύρινθοι', TOP_SCORE: 'Ρεκόρ', INSTRUCTIONS: 'Οδηγίες', OPTIONS: 'Ρυθμίσεις', GAME_SOUNDS: 'Ήχος', KEY_TONES: 'Πλήκτρο', VIBRATION: 'Δόνηση', LANGUAGE: 'Γλώσσα', ON: 'Ενεργό', OFF: 'Ανεν.', SYSTEM: 'Σύστημα', SELECT: 'Επιλογή', OK: 'OK', NEXT: 'Επόμενο', SELECTED: 'Επιλέχθηκε: %U', MAZE_NAMES: ['Χωρίς λαβύρινθο', 'Λαβ. 1', 'Λαβ. 2', 'Λαβ. 3', 'Λαβ. 4', 'Λαβ. 5'] },
    hr: { NEW_GAME: 'Nova igra', CONTINUE: 'Nastavi', LEVEL: 'Razina', MAZES: 'Labirinti', TOP_SCORE: 'Rekord', INSTRUCTIONS: 'Upute', OPTIONS: 'Postavke', GAME_SOUNDS: 'Zvuk', KEY_TONES: 'Tipke', VIBRATION: 'Vibr.', LANGUAGE: 'Jezik', ON: 'Uklj.', OFF: 'Isklj.', SYSTEM: 'Sustav', SELECT: 'Odaberi', OK: 'OK', NEXT: 'Dalje', SELECTED: '%U odabran', MAZE_NAMES: ['Bez labirinta', 'Lab. 1', 'Lab. 2', 'Lab. 3', 'Lab. 4', 'Lab. 5'] },
    ru: { NEW_GAME: 'Новая игра', CONTINUE: 'Продолжить', LEVEL: 'Уровень', MAZES: 'Лабиринты', TOP_SCORE: 'Рекорд', INSTRUCTIONS: 'Инструкция', OPTIONS: 'Настройки', GAME_SOUNDS: 'Звук', KEY_TONES: 'Клав.', VIBRATION: 'Вибр.', LANGUAGE: 'Язык', ON: 'Вкл.', OFF: 'Выкл.', SYSTEM: 'Система', SELECT: 'Выбрать', OK: 'ОК', NEXT: 'Далее', SELECTED: '%U выбрано', MAZE_NAMES: ['Без лабиринта', 'Лаб. 1', 'Лаб. 2', 'Лаб. 3', 'Лаб. 4', 'Лаб. 5'] },
    sr: { NEW_GAME: 'Нова игра', CONTINUE: 'Настави', LEVEL: 'Ниво', MAZES: 'Лавиринти', TOP_SCORE: 'Рекорд', INSTRUCTIONS: 'Упутство', OPTIONS: 'Подешавања', GAME_SOUNDS: 'Звук', KEY_TONES: 'Таст.', VIBRATION: 'Вибр.', LANGUAGE: 'Језик', ON: 'Укљ.', OFF: 'Искљ.', SYSTEM: 'Систем', SELECT: 'Изабери', OK: 'ОК', NEXT: 'Даље', SELECTED: '%U изабрано', MAZE_NAMES: ['Без лавиринта', 'Лав. 1', 'Лав. 2', 'Лав. 3', 'Лав. 4', 'Лав. 5'] },
    sl: { NEW_GAME: 'Nova igra', CONTINUE: 'Nadaljuj', LEVEL: 'Raven', MAZES: 'Labirinti', TOP_SCORE: 'Rekord', INSTRUCTIONS: 'Navodila', OPTIONS: 'Nastavitve', GAME_SOUNDS: 'Zvok', KEY_TONES: 'Tipke', VIBRATION: 'Vibr.', LANGUAGE: 'Jezik', ON: 'Vklop', OFF: 'Izklop', SYSTEM: 'Sistem', SELECT: 'Izberi', OK: 'OK', NEXT: 'Naprej', SELECTED: '%U izbrano', MAZE_NAMES: ['Brez labirinta', 'Lab. 1', 'Lab. 2', 'Lab. 3', 'Lab. 4', 'Lab. 5'] },
    uk: { NEW_GAME: 'Нова гра', CONTINUE: 'Продовжити', LEVEL: 'Рівень', MAZES: 'Лабіринти', TOP_SCORE: 'Рекорд', INSTRUCTIONS: 'Інструкція', OPTIONS: 'Налаштування', GAME_SOUNDS: 'Звук', KEY_TONES: 'Клав.', VIBRATION: 'Вібро', LANGUAGE: 'Мова', ON: 'Увімк.', OFF: 'Вимк.', SYSTEM: 'Система', SELECT: 'Обрати', OK: 'OK', NEXT: 'Далі', SELECTED: '%U вибрано', MAZE_NAMES: ['Без лабіринту', 'Лаб. 1', 'Лаб. 2', 'Лаб. 3', 'Лаб. 4', 'Лаб. 5'] },
    ar: { NEW_GAME: 'لعبة جديدة', CONTINUE: 'متابعة', LEVEL: 'المستوى', MAZES: 'المتاهات', TOP_SCORE: 'أعلى نتيجة', INSTRUCTIONS: 'التعليمات', OPTIONS: 'الإعدادات', GAME_SOUNDS: 'صوت', KEY_TONES: 'زر', VIBRATION: 'اهتزاز', LANGUAGE: 'اللغة', ON: 'تشغيل', OFF: 'إيقاف', SYSTEM: 'النظام', SELECT: 'اختيار', OK: 'موافق', NEXT: 'التالي', SELECTED: '%U محدد', MAZE_NAMES: ['بلا متاهة', 'متاهة 1', 'متاهة 2', 'متاهة 3', 'متاهة 4', 'متاهة 5'] },
    'zh-tw': { NEW_GAME: '新遊戲', CONTINUE: '繼續', LEVEL: '等級', MAZES: '迷宮', TOP_SCORE: '最高分', INSTRUCTIONS: '說明', OPTIONS: '設定', GAME_SOUNDS: '音效', KEY_TONES: '按鍵', VIBRATION: '震動', LANGUAGE: '語言', ON: '開', OFF: '關', SYSTEM: '系統', SELECT: '選擇', OK: '確定', NEXT: '下一步', SELECTED: '已選%U', MAZE_NAMES: ['無迷宮', '迷宮 1', '迷宮 2', '迷宮 3', '迷宮 4', '迷宮 5'] },
    tl: { NEW_GAME: 'Bagong laro', CONTINUE: 'Magpatuloy', LEVEL: 'Antas', MAZES: 'Mga labirinto', TOP_SCORE: 'Pinakamataas', INSTRUCTIONS: 'Panuto', OPTIONS: 'Opsyon', GAME_SOUNDS: 'Tunog', KEY_TONES: 'Susi', VIBRATION: 'Yugyog', LANGUAGE: 'Wika', ON: 'Bukas', OFF: 'Patay', SYSTEM: 'Sistema', SELECT: 'Piliin', OK: 'OK', NEXT: 'Susunod', SELECTED: 'Pinili: %U', MAZE_NAMES: ['Walang labirinto', 'Lab. 1', 'Lab. 2', 'Lab. 3', 'Lab. 4', 'Lab. 5'] },
    id: { NEW_GAME: 'Permainan baru', CONTINUE: 'Lanjutkan', LEVEL: 'Level', MAZES: 'Labirin', TOP_SCORE: 'Skor tertinggi', INSTRUCTIONS: 'Petunjuk', OPTIONS: 'Opsi', GAME_SOUNDS: 'Suara', KEY_TONES: 'Tombol', VIBRATION: 'Getar', LANGUAGE: 'Bahasa', ON: 'Aktif', OFF: 'Mati', SYSTEM: 'Sistem', SELECT: 'Pilih', OK: 'OK', NEXT: 'Berikut', SELECTED: '%U dipilih', MAZE_NAMES: ['Tanpa labirin', 'Lab. 1', 'Lab. 2', 'Lab. 3', 'Lab. 4', 'Lab. 5'] },
    ms: { NEW_GAME: 'Permainan baru', CONTINUE: 'Teruskan', LEVEL: 'Tahap', MAZES: 'Labirin', TOP_SCORE: 'Skor tertinggi', INSTRUCTIONS: 'Arahan', OPTIONS: 'Tetapan', GAME_SOUNDS: 'Bunyi', KEY_TONES: 'Kek.', VIBRATION: 'Getar', LANGUAGE: 'Bahasa', ON: 'Hidup', OFF: 'Mati', SYSTEM: 'Sistem', SELECT: 'Pilih', OK: 'OK', NEXT: 'Seterusnya', SELECTED: '%U dipilih', MAZE_NAMES: ['Tanpa labirin', 'Lab. 1', 'Lab. 2', 'Lab. 3', 'Lab. 4', 'Lab. 5'] },
    vi: { NEW_GAME: 'Trò chơi mới', CONTINUE: 'Tiếp tục', LEVEL: 'Cấp độ', MAZES: 'Mê cung', TOP_SCORE: 'Điểm cao', INSTRUCTIONS: 'Hướng dẫn', OPTIONS: 'Tùy chọn', GAME_SOUNDS: 'Âm', KEY_TONES: 'Phím', VIBRATION: 'Rung', LANGUAGE: 'Tiếng', ON: 'Bật', OFF: 'Tắt', SYSTEM: 'Hệ thống', SELECT: 'Chọn', OK: 'OK', NEXT: 'Tiếp', SELECTED: 'Đã chọn %U', MAZE_NAMES: ['Không mê cung', 'Mê cung 1', 'Mê cung 2', 'Mê cung 3', 'Mê cung 4', 'Mê cung 5'] },
    th: { NEW_GAME: 'เกมใหม่', CONTINUE: 'เล่นต่อ', LEVEL: 'ระดับ', MAZES: 'เขาวงกต', TOP_SCORE: 'คะแนนสูงสุด', INSTRUCTIONS: 'วิธีเล่น', OPTIONS: 'ตั้งค่า', GAME_SOUNDS: 'เสียง', KEY_TONES: 'ปุ่ม', VIBRATION: 'สั่น', LANGUAGE: 'ภาษา', ON: 'เปิด', OFF: 'ปิด', SYSTEM: 'ระบบ', SELECT: 'เลือก', OK: 'ตกลง', NEXT: 'ถัดไป', SELECTED: 'เลือก %U แล้ว', MAZE_NAMES: ['ไม่มีเขาวงกต', 'เขาวงกต 1', 'เขาวงกต 2', 'เขาวงกต 3', 'เขาวงกต 4', 'เขาวงกต 5'] },
    hi: { NEW_GAME: 'नया खेल', CONTINUE: 'जारी रखें', LEVEL: 'स्तर', MAZES: 'भूलभुलैया', TOP_SCORE: 'उच्च स्कोर', INSTRUCTIONS: 'निर्देश', OPTIONS: 'विकल्प', GAME_SOUNDS: 'ध्वनि', KEY_TONES: 'कुंजी', VIBRATION: 'कंपन', LANGUAGE: 'भाषा', ON: 'चालू', OFF: 'बंद', SYSTEM: 'सिस्टम', SELECT: 'चुनें', OK: 'ठीक', NEXT: 'आगे', SELECTED: '%U चुना गया', MAZE_NAMES: ['बिना भूलभुलैया', 'भूल. 1', 'भूल. 2', 'भूल. 3', 'भूल. 4', 'भूल. 5'] },
    'zh-cn': { NEW_GAME: '新游戏', CONTINUE: '继续', LEVEL: '等级', MAZES: '迷宫', TOP_SCORE: '最高分', INSTRUCTIONS: '说明', OPTIONS: '设置', GAME_SOUNDS: '音效', KEY_TONES: '按键', VIBRATION: '震动', LANGUAGE: '语言', ON: '开', OFF: '关', SYSTEM: '系统', SELECT: '选择', OK: '确定', NEXT: '下一步', SELECTED: '已选%U', MAZE_NAMES: ['无迷宫', '迷宫 1', '迷宫 2', '迷宫 3', '迷宫 4', '迷宫 5'] },
    he: { NEW_GAME: 'משחק חדש', CONTINUE: 'המשך', LEVEL: 'רמה', MAZES: 'מבוכים', TOP_SCORE: 'שיא', INSTRUCTIONS: 'הוראות', OPTIONS: 'אפשרויות', GAME_SOUNDS: 'צליל', KEY_TONES: 'מקש', VIBRATION: 'רטט', LANGUAGE: 'שפה', ON: 'פועל', OFF: 'כבוי', SYSTEM: 'מערכת', SELECT: 'בחר', OK: 'אישור', NEXT: 'הבא', SELECTED: '%U נבחר', MAZE_NAMES: ['בלי מבוך', 'מבוך 1', 'מבוך 2', 'מבוך 3', 'מבוך 4', 'מבוך 5'] },
    et: { NEW_GAME: 'Uus mäng', CONTINUE: 'Jätka', LEVEL: 'Tase', MAZES: 'Labürindid', TOP_SCORE: 'Rekord', INSTRUCTIONS: 'Juhised', OPTIONS: 'Seaded', GAME_SOUNDS: 'Heli', KEY_TONES: 'Klahv', VIBRATION: 'Värin', LANGUAGE: 'Keel', ON: 'Sees', OFF: 'Väljas', SYSTEM: 'Süsteem', SELECT: 'Vali', OK: 'OK', NEXT: 'Järgmine', SELECTED: '%U valitud', MAZE_NAMES: ['Labürindita', 'Lab. 1', 'Lab. 2', 'Lab. 3', 'Lab. 4', 'Lab. 5'] },
    lv: { NEW_GAME: 'Jauna spēle', CONTINUE: 'Turpināt', LEVEL: 'Līmenis', MAZES: 'Labirinti', TOP_SCORE: 'Rekords', INSTRUCTIONS: 'Instrukcija', OPTIONS: 'Iestatījumi', GAME_SOUNDS: 'Skaņa', KEY_TONES: 'Taust.', VIBRATION: 'Trīs', LANGUAGE: 'Valoda', ON: 'Iesl.', OFF: 'Izsl.', SYSTEM: 'Sistēma', SELECT: 'Izvēlēties', OK: 'OK', NEXT: 'Tālāk', SELECTED: '%U izvēlēts', MAZE_NAMES: ['Bez labirinta', 'Lab. 1', 'Lab. 2', 'Lab. 3', 'Lab. 4', 'Lab. 5'] },
    lt: { NEW_GAME: 'Naujas žaidimas', CONTINUE: 'Tęsti', LEVEL: 'Lygis', MAZES: 'Labirintai', TOP_SCORE: 'Rekordas', INSTRUCTIONS: 'Instrukcija', OPTIONS: 'Nustatymai', GAME_SOUNDS: 'Garsas', KEY_TONES: 'Mygt.', VIBRATION: 'Vibr.', LANGUAGE: 'Kalba', ON: 'Įjungta', OFF: 'Išj.', SYSTEM: 'Sistema', SELECT: 'Rinktis', OK: 'Gerai', NEXT: 'Toliau', SELECTED: '%U pasirinkta', MAZE_NAMES: ['Be labirinto', 'Lab. 1', 'Lab. 2', 'Lab. 3', 'Lab. 4', 'Lab. 5'] },
    cs: { NEW_GAME: 'Nová hra', CONTINUE: 'Pokračovat', LEVEL: 'Úroveň', MAZES: 'Bludiště', TOP_SCORE: 'Rekord', INSTRUCTIONS: 'Návod', OPTIONS: 'Nastavení', GAME_SOUNDS: 'Zvuk', KEY_TONES: 'Tóny', VIBRATION: 'Vibr.', LANGUAGE: 'Jazyk', ON: 'Zap', OFF: 'Vyp', SYSTEM: 'Systém', SELECT: 'Vybrat', OK: 'OK', NEXT: 'Další', SELECTED: '%U vybráno', MAZE_NAMES: ['Bez bludiště', 'Blud. 1', 'Blud. 2', 'Blud. 3', 'Blud. 4', 'Blud. 5'] }
  };

  Object.keys(MENU_TRANSLATIONS).forEach(function (code) {
    var source = MENU_TRANSLATIONS[code];
    var pack = PACKS[code] || {};
    for (var i = 0; i < MENU_KEYS.length; i++) pack[MENU_KEYS[i]] = source[MENU_KEYS[i]];
    PACKS[code] = pack;
  });

  function baseCode(value) {
    if (typeof value !== 'string') return null;
    var normalized = value.trim().toLowerCase().replace(/_/g, '-');
    var match = normalized.match(/^([a-z]{2,3})(?:-([a-z0-9]{2,8}))?(?:-|$)/);
    if (!match) return null;
    var code = match[1];
    var region = match[2] ? code + '-' + match[2] : null;
    if (region === 'zh-hant' || region === 'zh-tw' || region === 'zh-hk' || region === 'zh-mo') return 'zh-tw';
    if (region === 'zh-hans' || region === 'zh-cn' || region === 'zh-sg') return 'zh-cn';
    if (region && PACKS[region]) return region;
    if (code === 'nb' || code === 'nn') code = 'no';
    if (code === 'fil') code = 'tl';
    if (code === 'iw') code = 'he';
    if (code === 'in') code = 'id';
    if (code === 'zh') code = 'zh-cn';
    return PACKS[code] ? code : null;
  }

  function detect(languages) {
    if (!languages || !languages.length) {
      try {
        var nav = globalThis.navigator;
        languages = nav ? (Array.prototype.slice.call(nav.languages || []).concat(nav.language || [])) : [];
      }
      catch (ignore) { languages = null; }
    }
    if (typeof languages === 'string') languages = [languages];
    for (var i = 0; languages && i < languages.length; i++) {
      var code = baseCode(languages[i]);
      if (code) return code;
    }
    return 'en';
  }

  function resolve(choice, languages) {
    if (choice === null || choice === undefined || choice === '' || choice === 'system') return detect(languages);
    return baseCode(choice) || 'en';
  }

  function fontPack(choice) {
    return FONT_PACKS[resolve(choice)] || 'B';
  }

  function text(key, choice, params) {
    var code = resolve(choice);
    var value = (PACKS[code] && PACKS[code][key] !== undefined) ? PACKS[code][key] : English[key];
    if (value === undefined) return key;
    if (Array.isArray(value)) return value.slice();
    if (typeof value === 'string' && params) {
      value = value.replace(/%N/g, String(params.n === undefined ? '' : params.n))
        .replace(/%U/g, params.u === undefined ? '' : params.u);
    }
    return value;
  }

  var I18n = {
    LANGUAGES: LANGUAGES,
    PACKS: PACKS,
    detect: detect,
    resolve: resolve,
    text: text,
    fontPack: fontPack,
    languageName: function (code) {
      code = resolve(code);
      for (var i = 0; i < LANGUAGES.length; i++) if (LANGUAGES[i].code === code) return LANGUAGES[i].name;
      return 'English';
    }
  };
  NS.I18n = I18n;
  if (typeof module === 'object' && module.exports) module.exports = I18n;
})();
