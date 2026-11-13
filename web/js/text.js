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

  function parseSmall(table) {
    var out = {};
    Object.keys(table).forEach(function (ch) {
      var rows = table[ch].split('/');
      out[ch] = { w: rows[0].length, rows: rows };
    });
    return out;
  }

  var FONTS = { A: parseSmall(Pictures.FONT_A), B: parseSmall(Pictures.FONT_B) };
  var LARGE = parseSmall(Pictures.LARGE);
  var HEADER = parseSmall(Pictures.HEADER);

  var LARGE_ROWS = 11;
  var LARGE_BASELINE = 10;      // row of the cell the letters stand on
  var LARGE_SPACE = Pictures.LARGE_SPACE;
  var SMALL_BASELINE = 6;       // the capitals of the small fonts end on row 6 of the 8-row cell

  // ----- small fonts -------------------------------------------------------------------------------------------------

  function glyphOf(font, ch) {
    return FONTS[font][ch] || null;
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
      for (var r = 0; r < g.rows.length; r++) {
        for (var c = 0; c < g.w; c++) {
          if (g.rows[r].charAt(c) === '#') fb.set(x + c, y + r, invert ? 0 : 1);
        }
      }
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
      if (ch !== ' ' && !LARGE[ch]) return false;
    }
    return true;
  }

  function largeAdvance(ch) {
    if (ch === ' ') return LARGE_SPACE;
    var g = LARGE[ch];
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
      w += (ch === ' ' || LARGE[ch]) ? largeAdvance(ch) : LARGE_UNKNOWN_ADVANCE;
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
      if (Pictures.LARGE_EST[ch] && out.indexOf(ch) < 0) out.push(ch);
    }
    return out;
  }

  /** Draw with the upper left corner of the 11-row cell at (x, y). */
  function drawLarge(fb, str, x, y) {
    for (var i = 0; i < str.length; i++) {
      var ch = str.charAt(i);
      if (ch !== ' ') {
        var g = LARGE[ch];
        for (var r = 0; r < g.rows.length; r++) {
          for (var c = 0; c < g.w; c++) {
            if (g.rows[r].charAt(c) === '#') fb.set(x + c, y + r, 1);
          }
        }
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
