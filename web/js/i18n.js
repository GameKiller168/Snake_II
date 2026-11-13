/* Localized phone labels and browser-language detection. Translations and added glyph accents are marked EST in FIDELITY.md. */
(function () {
  'use strict';

  var NS = (globalThis.SnakeII = globalThis.SnakeII || {});
  var req = typeof require === 'function';
  var English = NS.Texts || (req ? require('./texts.js') : {});
  var LANGUAGES = [
    { code: 'en', name: 'English' }, { code: 'hu', name: 'Magyar' }, { code: 'ro', name: 'Română' },
    { code: 'de', name: 'Deutsch' }, { code: 'sk', name: 'Slovenčina' }, { code: 'pl', name: 'Polski' },
    { code: 'fr', name: 'Français' }, { code: 'es', name: 'Español' }
  ];

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
      TOP_SCORE_NOTE: 'Récord:\n%N', GAME_OVER_TOP: 'Fin del juego\nRÉCORD:\n%N', GAME_OVER_SCORE: 'Fin del juego\nTu puntuación:\n%N',
      INSTRUCTION_TEXT: 'Haz crecer la serpiente dirigiéndola hacia la comida. Usa las teclas 2, 4, 6 y 8. No puede parar ni retroceder. Evita las paredes y la cola.',
      YOU_WON: '¡HAS GANADO!', OPTIONS: 'Opciones', GAME_SOUNDS: 'Sonido', KEY_TONES: 'Teclas', VIBRATION: 'Vibración', LANGUAGE: 'Idioma', ON: 'Sí', OFF: 'No', SYSTEM: 'Sistema',
      KEYS: 'Teclas', DISPLAY: 'Pantalla del juego', SCROLL_UP: 'Subir', SCROLL_DOWN: 'Bajar', BUTTON_SELECT: 'Elegir',
      KEYBOARD_HELP: 'Teclado: flechas o 2 4 6 8 mueven la serpiente, Intro = elegir, Retroceso = C, arriba / abajo = menú.'
    }
  };

  function baseCode(value) {
    if (typeof value !== 'string') return null;
    var match = value.trim().toLowerCase().match(/^([a-z]{2,3})(?:[-_]|$)/);
    if (!match) return null;
    var code = match[1];
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
    languageName: function (code) {
      code = resolve(code);
      for (var i = 0; i < LANGUAGES.length; i++) if (LANGUAGES[i].code === code) return LANGUAGES[i].name;
      return 'English';
    }
  };
  NS.I18n = I18n;
  if (typeof module === 'object' && module.exports) module.exports = I18n;
})();
