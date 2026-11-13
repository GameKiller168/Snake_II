/*
 * Drawing texts into the 84 x 48 matrix: the two small fonts (A thin, B bold), the large font of the notes and
 * the numbers of the menu header. The glyph pictures live in pictures.js.
 *
 * Rules (all measured or read from the phone, see FIDELITY.md):
 *   - small fonts: proportional, one empty column after every glyph, cells 8 rows high
 *   - large font: one empty column after every glyph (R is the one exception, see pictures.js), a space is 3 columns wide,
 *     cells 11 rows high. Glyphs are measured in footage or, where marked [EST] in pictures.js (LARGE_EST), drawn after
 *     the pattern of the measured ones; a line that needs a glyph that is in neither table is drawn in the bold font
 *     instead. The width of such a glyph is [EST] 8 columns when text is wrapped into lines.
 *   - header numbers: boxes 5 wide, one empty column between boxes, "-" is 2 columns wide and sits on row 3,
 *     the string ends at column 82
 */
(function () {
  'use strict';

  var NS = (globalThis.SnakeII = globalThis.SnakeII || {});
  var Pictures = NS.Pictures || (typeof require === 'function' ? require('./pictures.js') : null);
  var ACCENTED = {
    '\u00c0': ['A', 'grave'], '\u00c1': ['A', 'acute'], '\u00c2': ['A', 'circumflex'], '\u00c3': ['A', 'tilde'], '\u00c4': ['A', 'diaeresis'], '\u00c5': ['A', 'ring'],
    '\u0102': ['A', 'breve'], '\u0104': ['A', 'ogonek'], '\u00c7': ['C', 'comma'], '\u0106': ['C', 'acute'], '\u010c': ['C', 'caron'], '\u010e': ['D', 'caron'], '\u0110': ['D', 'stroke'],
    '\u00c8': ['E', 'grave'], '\u00c9': ['E', 'acute'], '\u00ca': ['E', 'circumflex'], '\u00cb': ['E', 'diaeresis'], '\u0118': ['E', 'ogonek'], '\u011a': ['E', 'caron'],
    '\u00cc': ['I', 'grave'], '\u00cd': ['I', 'acute'], '\u00ce': ['I', 'circumflex'], '\u00cf': ['I', 'diaeresis'],
    '\u0139': ['L', 'acute'], '\u013d': ['L', 'caron'], '\u0141': ['L', 'stroke'], '\u0143': ['N', 'acute'], '\u00d1': ['N', 'tilde'], '\u0147': ['N', 'caron'],
    '\u00d2': ['O', 'grave'], '\u00d3': ['O', 'acute'], '\u00d4': ['O', 'circumflex'], '\u00d5': ['O', 'tilde'], '\u00d6': ['O', 'diaeresis'], '\u0150': ['O', 'doubleacute'],
    '\u0154': ['R', 'acute'], '\u0158': ['R', 'caron'], '\u015a': ['S', 'acute'], '\u0160': ['S', 'caron'], '\u015e': ['S', 'comma'], '\u0218': ['S', 'comma'],
    '\u0164': ['T', 'caron'], '\u0162': ['T', 'comma'], '\u021a': ['T', 'comma'], '\u00d9': ['U', 'grave'], '\u00da': ['U', 'acute'], '\u00db': ['U', 'circumflex'],
    '\u00dc': ['U', 'diaeresis'], '\u016e': ['U', 'ring'], '\u0170': ['U', 'doubleacute'], '\u00dd': ['Y', 'acute'], '\u0178': ['Y', 'diaeresis'],
    '\u0179': ['Z', 'acute'], '\u017b': ['Z', 'dot'], '\u017d': ['Z', 'caron'],
    '\u00e0': ['a', 'grave'], '\u00e1': ['a', 'acute'], '\u00e2': ['a', 'circumflex'], '\u00e3': ['a', 'tilde'], '\u00e4': ['a', 'diaeresis'], '\u00e5': ['a', 'ring'],
    '\u0103': ['a', 'breve'], '\u0105': ['a', 'ogonek'], '\u00e7': ['c', 'comma'], '\u0107': ['c', 'acute'], '\u010d': ['c', 'caron'], '\u010f': ['d', 'caron'], '\u0111': ['d', 'stroke'],
    '\u00e8': ['e', 'grave'], '\u00e9': ['e', 'acute'], '\u00ea': ['e', 'circumflex'], '\u00eb': ['e', 'diaeresis'], '\u0119': ['e', 'ogonek'], '\u011b': ['e', 'caron'],
    '\u00ec': ['i', 'grave'], '\u00ed': ['i', 'acute'], '\u00ee': ['i', 'circumflex'], '\u00ef': ['i', 'diaeresis'],
    '\u013a': ['l', 'acute'], '\u013e': ['l', 'caron'], '\u0142': ['l', 'stroke'], '\u0144': ['n', 'acute'], '\u00f1': ['n', 'tilde'], '\u0148': ['n', 'caron'],
    '\u00f2': ['o', 'grave'], '\u00f3': ['o', 'acute'], '\u00f4': ['o', 'circumflex'], '\u00f5': ['o', 'tilde'], '\u00f6': ['o', 'diaeresis'], '\u0151': ['o', 'doubleacute'],
    '\u0155': ['r', 'acute'], '\u0159': ['r', 'caron'], '\u015b': ['s', 'acute'], '\u0161': ['s', 'caron'], '\u015f': ['s', 'comma'], '\u0219': ['s', 'comma'],
    '\u0165': ['t', 'caron'], '\u0163': ['t', 'comma'], '\u021b': ['t', 'comma'], '\u00f9': ['u', 'grave'], '\u00fa': ['u', 'acute'], '\u00fb': ['u', 'circumflex'],
    '\u00fc': ['u', 'diaeresis'], '\u016f': ['u', 'ring'], '\u0171': ['u', 'doubleacute'], '\u00fd': ['y', 'acute'], '\u00ff': ['y', 'diaeresis'],
    '\u017a': ['z', 'acute'], '\u017c': ['z', 'dot'], '\u017e': ['z', 'caron']
  };

  function accentedGlyph(table, ch) {
    var def = ACCENTED[ch];
    if (!def) return null;
    var base = table[def[0]];
    return base ? { w: base.w, rows: base.rows, mark: def[1] } : null;
  }

  function glyph(font, ch) {
    if (ch === '\u2018' || ch === '\u2019') ch = "'";
    var other = font === 'B' ? 'A' : 'B';
    return FONTS[font][ch] || accentedGlyph(FONTS[font], ch) || FONTS[other][ch] || accentedGlyph(FONTS[other], ch) ||
      SMALL_EST[ch] || accentedGlyph(SMALL_EST, ch);
  }

  function accentPixels(mark, w, h) {
    var mid = Math.floor((w - 1) / 2);
    if (mark === 'acute') return [[Math.max(0, w - 2), -2], [Math.max(0, w - 1), -1]];
    if (mark === 'grave') return [[0, -2], [Math.min(w - 1, 1), -1]];
    if (mark === 'diaeresis') return [[Math.max(0, mid - 1), -2], [Math.min(w - 1, mid + 1), -2]];
    if (mark === 'circumflex') return [[Math.max(0, mid - 1), -2], [mid, -1], [Math.min(w - 1, mid + 1), -2]];
    if (mark === 'caron') return [[Math.max(0, mid - 1), -2], [mid, -1], [Math.min(w - 1, mid + 1), -1], [Math.min(w - 1, mid + 2), -2]];
    if (mark === 'tilde') return [[Math.max(0, mid - 2), -2], [Math.max(0, mid - 1), -1], [mid, -2], [Math.min(w - 1, mid + 1), -1]];
    if (mark === 'breve') return [[Math.max(0, mid - 1), -1], [mid, -2], [Math.min(w - 1, mid + 1), -2], [Math.min(w - 1, mid + 2), -1]];
    if (mark === 'doubleacute') return [[Math.max(0, mid - 2), -2], [Math.max(0, mid - 1), -1], [Math.min(w - 1, mid + 1), -2], [Math.min(w - 1, mid + 2), -1]];
    if (mark === 'ring') return [[Math.max(0, mid - 1), -2], [Math.min(w - 1, mid + 1), -2], [mid, -3]];
    if (mark === 'dot') return [[mid, -1]];
    if (mark === 'comma') return [[Math.min(w - 1, mid + 1), h], [Math.min(w - 1, mid + 1), h + 1]];
    if (mark === 'ogonek') return [[Math.min(w - 1, mid + 1), h - 1], [Math.min(w - 1, mid + 2), h], [Math.min(w - 1, mid + 2), h + 1]];
    return [];
  }

  function drawGlyph(fb, g, x, y, invert, large) {
    var rows = g.rows;
    for (var r = 0; r < rows.length; r++) {
      for (var c = 0; c < g.w; c++) {
        if (rows[r].charAt(c) === '#') fb.set(x + c, y + r, invert ? 0 : 1);
      }
    }
    if (g.mark) {
      var pixels = accentPixels(g.mark, g.w, rows.length);
      for (var i = 0; i < pixels.length; i++) fb.set(x + pixels[i][0], y + pixels[i][1], invert ? 0 : 1);
      if (g.mark === 'stroke') {
        for (var s = 0; s < g.w; s++) {
          var row = Math.floor(rows.length / 2) + 1 - Math.round((s * 2) / Math.max(1, g.w - 1));
          fb.set(x + s, y + row, invert ? 0 : 1);
        }
      }
    }
  }

  function parseSmall(table) {
    var out = {};
    Object.keys(table).forEach(function (ch) {
      var rows = table[ch].split('/');
      out[ch] = { w: rows[0].length, rows: rows };
    });
    return out;
  }

  var FONTS = { A: parseSmall(Pictures.FONT_A), B: parseSmall(Pictures.FONT_B) };
  // The English firmware font omits letters it never needs. These Nokia-style completions are EST glyphs.
  var SMALL_EST = parseSmall({
    '-': '...../...../...../#####/...../...../...../.....',
    "'": '..##./..##./...../...../...../...../...../.....',
    'A': '#####/##.##/##.##/#####/##.##/##.##/##.##/.....',
    'B': '####./##.##/##.##/####./##.##/##.##/####./.....',
    'D': '####./##.##/##.##/##.##/##.##/##.##/####./.....',
    'F': '#####/##.../##.../####./##.../##.../##.../.....',
    'H': '##.##/##.##/##.##/#####/##.##/##.##/##.##/.....',
    'J': '...##/...##/...##/...##/...##/##.##/.###./.....',
    'Q': '..###../.##.##./##...##/##...##/##...##/.##.##./..####./......',
    'V': '##.##/##.##/##.##/##.##/.#.#./.###./..#../.....',
    'W': '##...##/##...##/##.#.##/##.#.##/##.#.##/.##.##./.##.##./.......',
    'X': '##...##/.##.##./..###../..###../..###../.##.##./##...##/.......',
    'Z': '#####/...##/..##./.##../##.../##.../#####/.....',
    'j': '...#/..../..##/...#/...#/...#/##.#/.##.',
    'q': '...../...../.####/##.##/##.##/##.##/.####/...##/...##'
  });
  var LARGE = parseSmall(Pictures.LARGE);
  var HEADER = parseSmall(Pictures.HEADER);

  var LARGE_ROWS = 11;
  var LARGE_BASELINE = 10;      // row of the cell the letters stand on
  var LARGE_SPACE = Pictures.LARGE_SPACE;
  var SMALL_BASELINE = 6;       // the capitals of the small fonts end on row 6 of the 8-row cell

  // ----- small fonts -------------------------------------------------------------------------------------------------

  function glyphOf(font, ch) {
    return glyph(font, ch) || null;
  }

  /** Width of a string with the one empty column after every glyph. */
  function width(font, str) {
    var w = 0;
    for (var i = 0; i < str.length; i++) {
      var g = glyphOf(font, str.charAt(i));
      if (!g) throw new Error('font ' + font + ' has no glyph for ' + JSON.stringify(str.charAt(i)));
      w += g.w + 1;
    }
    return w;
  }

  function canDraw(font, str) {
    for (var i = 0; i < str.length; i++) {
      if (!glyphOf(font, str.charAt(i))) return false;
    }
    return true;
  }

  /**
   * Draw str with the cell's upper left corner at (x, y). invert = true clears the glyph pixels instead of setting
   * them (text on a dark bar). Returns the x after the last glyph.
   */
  function draw(fb, font, str, x, y, invert) {
    for (var i = 0; i < str.length; i++) {
      var g = glyphOf(font, str.charAt(i));
      if (!g) throw new Error('font ' + font + ' has no glyph for ' + JSON.stringify(str.charAt(i)));
      drawGlyph(fb, g, x, y, invert, false);
      x += g.w + 1;
    }
    return x;
  }

  /** Greedy word wrap into lines no wider than maxW; "\n" always breaks. */
  function wrap(font, str, maxW) {
    var lines = [];
    var paras = str.split('\n');
    for (var p = 0; p < paras.length; p++) {
      var words = paras[p].split(' ');
      var cur = '';
      for (var i = 0; i < words.length; i++) {
        var test = cur === '' ? words[i] : cur + ' ' + words[i];
        if (cur !== '' && width(font, test) - 1 > maxW) {
          lines.push(cur);
          cur = words[i];
        } else {
          cur = test;
        }
      }
      lines.push(cur);
    }
    return lines;
  }

  // ----- large font of the notes ------------------------------------------------------------------------------------

  function canDrawLarge(str) {
    for (var i = 0; i < str.length; i++) {
      var ch = str.charAt(i);
      if (ch !== ' ' && !(LARGE[ch] || accentedGlyph(LARGE, ch))) return false;
    }
    return true;
  }

  function largeAdvance(ch) {
    if (ch === ' ') return LARGE_SPACE;
    var g = LARGE[ch] || accentedGlyph(LARGE, ch);
    return Pictures.LARGE_ADV[ch] || g.w + 1;
  }

  function widthLarge(str) {
    var w = 0;
    for (var i = 0; i < str.length; i++) w += largeAdvance(str.charAt(i));
    return w;
  }

  var LARGE_UNKNOWN_ADVANCE = 8;       // [EST] advance of a glyph the tables do not have (only used to wrap text)

  /** Width of a string in the large font; glyphs the tables lack count LARGE_UNKNOWN_ADVANCE columns. */
  function widthLargeEst(str) {
    var w = 0;
    for (var i = 0; i < str.length; i++) {
      var ch = str.charAt(i);
      w += (ch === ' ' || LARGE[ch] || accentedGlyph(LARGE, ch)) ? largeAdvance(ch) : LARGE_UNKNOWN_ADVANCE;
    }
    return w;
  }

  /** Greedy word wrap with the large font into lines no wider than maxW columns; "\n" always breaks. */
  function wrapLarge(str, maxW) {
    var lines = [];
    var paras = str.split('\n');
    for (var p = 0; p < paras.length; p++) {
      var words = paras[p].split(' ');
      var cur = '';
      for (var i = 0; i < words.length; i++) {
        var test = cur === '' ? words[i] : cur + ' ' + words[i];
        if (cur !== '' && widthLargeEst(test) - 1 > maxW) {
          lines.push(cur);
          cur = words[i];
        } else {
          cur = test;
        }
      }
      lines.push(cur);
    }
    return lines;
  }

  /** The distinct glyphs of str that are estimates (Pictures.LARGE_EST), in order of appearance. */
  function estimatedGlyphs(str) {
    var out = [];
    for (var i = 0; i < str.length; i++) {
      var ch = str.charAt(i);
      if ((Pictures.LARGE_EST[ch] || ACCENTED[ch]) && out.indexOf(ch) < 0) out.push(ch);
    }
    return out;
  }

  /** Draw with the upper left corner of the 11-row cell at (x, y). */
  function drawLarge(fb, str, x, y) {
    for (var i = 0; i < str.length; i++) {
      var ch = str.charAt(i);
      if (ch !== ' ') {
        var g = LARGE[ch] || accentedGlyph(LARGE, ch);
        drawGlyph(fb, g, x, y, false, true);
      }
      x += largeAdvance(ch);
    }
    return x;
  }

  /**
   * One line of a note. The large font when it has every glyph of the line, else the bold font with the baseline on
   * the baseline of the large cell. Returns 'large' or 'bold'.
   */
  function drawNoteLine(fb, str, x, y) {
    if (canDrawLarge(str)) {
      drawLarge(fb, str, x, y);
      return 'large';
    }
    draw(fb, 'B', str, x, y + LARGE_BASELINE - SMALL_BASELINE, false);
    return 'bold';
  }

  // ----- the numbers of the menu header ---------------------------------------------------------------------------------

  /** str is like "8-1-3": digits and dashes. Drawn on rows 0..5, ending at column 82. */
  function drawHeader(fb, str) {
    var total = 0, i, ch;
    for (i = 0; i < str.length; i++) {
      ch = str.charAt(i);
      total += (ch === '-' ? 2 : 5) + 1;
    }
    total -= 1;
    var x = 83 - total;
    for (i = 0; i < str.length; i++) {
      ch = str.charAt(i);
      if (ch === '-') {
        fb.set(x, 3, 1);
        fb.set(x + 1, 3, 1);
        x += 3;
      } else {
        var g = HEADER[ch];
        if (!g) throw new Error('no header glyph for ' + JSON.stringify(ch));
        for (var r = 0; r < g.rows.length; r++) {
          for (var c = 0; c < g.w; c++) {
            if (g.rows[r].charAt(c) === '#') fb.set(x + c, r, 1);
          }
        }
        x += 6;
      }
    }
  }

  var Text = {
    width: width,
    canDraw: canDraw,
    draw: draw,
    wrap: wrap,
    canDrawLarge: canDrawLarge,
    widthLarge: widthLarge,
    widthLargeEst: widthLargeEst,
    wrapLarge: wrapLarge,
    estimatedGlyphs: estimatedGlyphs,
    drawLarge: drawLarge,
    drawNoteLine: drawNoteLine,
    drawHeader: drawHeader,
    LARGE_ROWS: LARGE_ROWS,
    FONTS: FONTS
  };

  NS.Text = Text;
  if (typeof module === 'object' && module.exports) module.exports = Text;
})();
