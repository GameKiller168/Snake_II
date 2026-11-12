/*
 * Bitmap fonts for the 84 x 48 LCD.
 *
 *   digit3x5  - the score digits of the original (derived 1:1 from Display.java, 2021)
 *   font3x5   - small capitals in the same style (for captions)
 *   font5x7   - classic 5 x 7 capitals, digits and a few symbols (titles, menus)
 *
 * A glyph is a list of row strings, 'X' = pixel on, '.' = off; the width of a glyph is the length of
 * its rows, so punctuation can be narrow. Text is drawn with one blank pixel column between glyphs.
 */
(function () {
  'use strict';

  var NS = (globalThis.SnakeII = globalThis.SnakeII || {});

  // ---------------------------------------------------------------------------------------------
  // 3 x 5 digits - exactly the shapes Display.Num0 .. Num9 paint
  // ---------------------------------------------------------------------------------------------
  var digit3x5 = {
    '0': ['XXX', 'X.X', 'X.X', 'X.X', 'XXX'],
    '1': ['..X', '.XX', '..X', '..X', '..X'],
    '2': ['XXX', '..X', 'XXX', 'X..', 'XXX'],
    '3': ['XXX', '..X', 'XXX', '..X', 'XXX'],
    '4': ['X.X', 'X.X', 'XXX', '..X', '..X'],
    '5': ['XXX', 'X..', 'XXX', '..X', 'XXX'],
    '6': ['XXX', 'X..', 'XXX', 'X.X', 'XXX'],
    '7': ['XXX', '..X', '..X', '..X', '..X'],
    '8': ['XXX', 'X.X', 'XXX', 'X.X', 'XXX'],
    '9': ['XXX', 'X.X', 'XXX', '..X', 'XXX']
  };

  // ---------------------------------------------------------------------------------------------
  // 3 x 5 capitals (captions)
  // ---------------------------------------------------------------------------------------------
  var font3x5 = {
    'A': ['.X.', 'X.X', 'XXX', 'X.X', 'X.X'],
    'B': ['XX.', 'X.X', 'XX.', 'X.X', 'XX.'],
    'C': ['.XX', 'X..', 'X..', 'X..', '.XX'],
    'D': ['XX.', 'X.X', 'X.X', 'X.X', 'XX.'],
    'E': ['XXX', 'X..', 'XX.', 'X..', 'XXX'],
    'F': ['XXX', 'X..', 'XX.', 'X..', 'X..'],
    'G': ['.XX', 'X..', 'X.X', 'X.X', '.XX'],
    'H': ['X.X', 'X.X', 'XXX', 'X.X', 'X.X'],
    'I': ['XXX', '.X.', '.X.', '.X.', 'XXX'],
    'J': ['..X', '..X', '..X', 'X.X', '.X.'],
    'K': ['X.X', 'X.X', 'XX.', 'X.X', 'X.X'],
    'L': ['X..', 'X..', 'X..', 'X..', 'XXX'],
    'M': ['X.X', 'XXX', 'XXX', 'X.X', 'X.X'],
    'N': ['XX.', 'X.X', 'X.X', 'X.X', 'X.X'],
    'O': ['.X.', 'X.X', 'X.X', 'X.X', '.X.'],
    'P': ['XX.', 'X.X', 'XX.', 'X..', 'X..'],
    'Q': ['.X.', 'X.X', 'X.X', 'XX.', '.XX'],
    'R': ['XX.', 'X.X', 'XX.', 'X.X', 'X.X'],
    'S': ['.XX', 'X..', '.X.', '..X', 'XX.'],
    'T': ['XXX', '.X.', '.X.', '.X.', '.X.'],
    'U': ['X.X', 'X.X', 'X.X', 'X.X', 'XXX'],
    'V': ['X.X', 'X.X', 'X.X', 'X.X', '.X.'],
    'W': ['X.X', 'X.X', 'XXX', 'XXX', 'X.X'],
    'X': ['X.X', 'X.X', '.X.', 'X.X', 'X.X'],
    'Y': ['X.X', 'X.X', '.X.', '.X.', '.X.'],
    'Z': ['XXX', '..X', '.X.', 'X..', 'XXX'],
    '-': ['...', '...', 'XXX', '...', '...'],
    '.': ['.', '.', '.', '.', 'X'],
    ':': ['.', 'X', '.', 'X', '.'],
    '!': ['X', 'X', 'X', '.', 'X'],
    '<': ['..X', '.X.', 'X..', '.X.', '..X'],
    '>': ['X..', '.X.', '..X', '.X.', 'X..'],
    ' ': ['..', '..', '..', '..', '..']
  };
  for (var d3 in digit3x5) font3x5[d3] = digit3x5[d3];

  // ---------------------------------------------------------------------------------------------
  // 5 x 7 capitals (titles, menus)
  // ---------------------------------------------------------------------------------------------
  var font5x7 = {
    'A': ['.XXX.', 'X...X', 'X...X', 'XXXXX', 'X...X', 'X...X', 'X...X'],
    'B': ['XXXX.', 'X...X', 'X...X', 'XXXX.', 'X...X', 'X...X', 'XXXX.'],
    'C': ['.XXX.', 'X...X', 'X....', 'X....', 'X....', 'X...X', '.XXX.'],
    'D': ['XXXX.', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', 'XXXX.'],
    'E': ['XXXXX', 'X....', 'X....', 'XXXX.', 'X....', 'X....', 'XXXXX'],
    'F': ['XXXXX', 'X....', 'X....', 'XXXX.', 'X....', 'X....', 'X....'],
    'G': ['.XXX.', 'X...X', 'X....', 'X.XXX', 'X...X', 'X...X', '.XXXX'],
    'H': ['X...X', 'X...X', 'X...X', 'XXXXX', 'X...X', 'X...X', 'X...X'],
    'I': ['.XXX.', '..X..', '..X..', '..X..', '..X..', '..X..', '.XXX.'],
    'J': ['..XXX', '...X.', '...X.', '...X.', '...X.', 'X..X.', '.XX..'],
    'K': ['X...X', 'X..X.', 'X.X..', 'XX...', 'X.X..', 'X..X.', 'X...X'],
    'L': ['X....', 'X....', 'X....', 'X....', 'X....', 'X....', 'XXXXX'],
    'M': ['X...X', 'XX.XX', 'X.X.X', 'X.X.X', 'X...X', 'X...X', 'X...X'],
    'N': ['X...X', 'XX..X', 'X.X.X', 'X..XX', 'X...X', 'X...X', 'X...X'],
    'O': ['.XXX.', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', '.XXX.'],
    'P': ['XXXX.', 'X...X', 'X...X', 'XXXX.', 'X....', 'X....', 'X....'],
    'Q': ['.XXX.', 'X...X', 'X...X', 'X...X', 'X.X.X', 'X..X.', '.XX.X'],
    'R': ['XXXX.', 'X...X', 'X...X', 'XXXX.', 'X.X..', 'X..X.', 'X...X'],
    'S': ['.XXXX', 'X....', 'X....', '.XXX.', '....X', '....X', 'XXXX.'],
    'T': ['XXXXX', '..X..', '..X..', '..X..', '..X..', '..X..', '..X..'],
    'U': ['X...X', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', '.XXX.'],
    'V': ['X...X', 'X...X', 'X...X', 'X...X', 'X...X', '.X.X.', '..X..'],
    'W': ['X...X', 'X...X', 'X...X', 'X.X.X', 'X.X.X', 'XX.XX', 'X...X'],
    'X': ['X...X', 'X...X', '.X.X.', '..X..', '.X.X.', 'X...X', 'X...X'],
    'Y': ['X...X', 'X...X', '.X.X.', '..X..', '..X..', '..X..', '..X..'],
    'Z': ['XXXXX', '....X', '...X.', '..X..', '.X...', 'X....', 'XXXXX'],
    '0': ['.XXX.', 'X...X', 'X..XX', 'X.X.X', 'XX..X', 'X...X', '.XXX.'],
    '1': ['..X..', '.XX..', '..X..', '..X..', '..X..', '..X..', '.XXX.'],
    '2': ['.XXX.', 'X...X', '....X', '...X.', '..X..', '.X...', 'XXXXX'],
    '3': ['XXXXX', '...X.', '..X..', '...X.', '....X', 'X...X', '.XXX.'],
    '4': ['...X.', '..XX.', '.X.X.', 'X..X.', 'XXXXX', '...X.', '...X.'],
    '5': ['XXXXX', 'X....', 'XXXX.', '....X', '....X', 'X...X', '.XXX.'],
    '6': ['..XX.', '.X...', 'X....', 'XXXX.', 'X...X', 'X...X', '.XXX.'],
    '7': ['XXXXX', '....X', '...X.', '..X..', '.X...', '.X...', '.X...'],
    '8': ['.XXX.', 'X...X', 'X...X', '.XXX.', 'X...X', 'X...X', '.XXX.'],
    '9': ['.XXX.', 'X...X', 'X...X', '.XXXX', '....X', '...X.', '.XX..'],
    '<': ['...X.', '..X..', '.X...', 'X....', '.X...', '..X..', '...X.'],
    '>': ['.X...', '..X..', '...X.', '....X', '...X.', '..X..', '.X...'],
    '-': ['.....', '.....', '.....', 'XXXXX', '.....', '.....', '.....'],
    ':': ['.', '.', 'X', '.', 'X', '.', '.'],
    '.': ['.', '.', '.', '.', '.', '.', 'X'],
    '!': ['X', 'X', 'X', 'X', 'X', '.', 'X'],
    '?': ['.XXX.', 'X...X', '....X', '...X.', '..X..', '.....', '..X..'],
    ' ': ['...', '...', '...', '...', '...', '...', '...']
  };

  var FONTS = { digit3x5: digit3x5, font3x5: font3x5, font5x7: font5x7 };

  function glyphOf(font, ch) {
    return font[ch] || font[ch.toUpperCase()] || font['?'] || font[' '];
  }

  /** Width in LCD pixels of a text (one blank column between glyphs). */
  function measure(text, font) {
    var f = typeof font === 'string' ? FONTS[font] : font;
    var w = 0;
    for (var i = 0; i < text.length; i++) {
      w += glyphOf(f, text.charAt(i))[0].length;
      if (i < text.length - 1) w += 1;
    }
    return w;
  }

  function heightOf(font) {
    var f = typeof font === 'string' ? FONTS[font] : font;
    return f['A'] ? f['A'].length : f['0'].length;
  }

  /**
   * Draws text with its top-left corner at (x, y). Returns the x after the last glyph.
   * opts.invert paints the glyph "off" (to cut text out of a black box).
   */
  function drawText(fb, text, x, y, font, opts) {
    var f = typeof font === 'string' ? FONTS[font] : font;
    var on = opts && opts.invert ? 0 : 1;
    var cx = x;
    for (var i = 0; i < text.length; i++) {
      var g = glyphOf(f, text.charAt(i));
      for (var r = 0; r < g.length; r++) {
        var row = g[r];
        for (var c = 0; c < row.length; c++) {
          if (row.charAt(c) === 'X') fb.set(cx + c, y + r, on);
        }
      }
      cx += g[0].length + 1;
    }
    return cx - 1;
  }

  /** Draws text horizontally centred around centerX (default: middle of the LCD). */
  function drawCentered(fb, text, y, font, opts) {
    var w = measure(text, font);
    var cx = opts && opts.centerX != null ? opts.centerX : fb.w / 2;
    var x = Math.round(cx - w / 2);
    drawText(fb, text, x, y, font, opts);
    return x;
  }

  /** One digit in the 3 x 5 score style. */
  function drawDigit(fb, digit, x, y) {
    drawText(fb, String(digit), x, y, digit3x5);
  }

  var Font = {
    digit3x5: digit3x5,
    font3x5: font3x5,
    font5x7: font5x7,
    measure: measure,
    heightOf: heightOf,
    drawText: drawText,
    drawCentered: drawCentered,
    drawDigit: drawDigit
  };

  NS.Font = Font;
  if (typeof module === 'object' && module.exports) module.exports = Font;
})();
