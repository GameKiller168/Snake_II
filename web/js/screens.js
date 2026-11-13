/*
 * The screens around the game, drawn into the 84 x 48 matrix: start-up animation, menus, level, notes,
 * instruction pages. Positions are LCD pixels, measured in footage of real phones unless marked [EST]
 * (see FIDELITY.md for every number and its evidence).
 *
 *   menu      list area rows 7..36, three lines of 10 rows; the selected line is a bar (cols 0..78) with the text
 *             cleared out of it; bold font, text 2 columns in and one row below the top of the line; numbers in the
 *             header (rows 0..5, ending at column 82); scroll bar on the right (columns 81..83); soft key centred on row 40.
 *             Lists are circular: the state is two numbers, s = item on the top line, c = item with the cursor
 *             (moveCursor); the window wraps around the end of the list [VIDEO B, D]
 *   level     label "Level:" at (6, 0), nine bars, soft key
 *   note      lines of the large font at the row tops 3, 18, 33; left aligned at column 0; some notes have an icon in
 *             the upper right corner and then wrap their text before column 68
 *   instructions  thin font, three lines per page at the row tops 7, 16, 25, text from column 1, soft key "Next"
 */
(function () {
  'use strict';

  var NS = (globalThis.SnakeII = globalThis.SnakeII || {});
  var req = typeof require === 'function';
  var Pictures = NS.Pictures || (req ? require('./pictures.js') : null);
  var Text = NS.Text || (req ? require('./text.js') : null);
  var Texts = NS.Texts || (req ? require('./texts.js') : null);
  var Framebuffer = NS.Framebuffer || (req ? require('./framebuffer.js') : null);

  var LIST_TOP = 7, LINE_H = 10, LINES = 3;
  var BAR_W = 79;                 // columns 0..78
  var SOFTKEY_Y = 40;
  var NOTE_TOP = 3, NOTE_PITCH = 15;
  var PAGE_TOP = [7, 16, 25];
  var PAGE_X = 1;
  var PAGE_WIDTH = 82;            // [EST] columns 1..82

  // ----- start-up animation -------------------------------------------------------------------------------------------

  var splashRows = null;
  function splashPicture() {
    if (!splashRows) {
      var S = Pictures.SPLASH;
      splashRows = { base: S.base, overlays: S.overlays };
    }
    return splashRows;
  }

  function blit(fb, rows, x, y) {
    for (var r = 0; r < rows.length; r++) {
      for (var c = 0; c < rows[r].length; c++) fb.set(x + c, y + r, rows[r].charAt(c) === '#' ? 1 : 0);
    }
  }

  /** The picture t ms after the start. */
  function drawSplash(fb, t) {
    var S = Pictures.SPLASH;
    blit(fb, S.base, 0, 0);
    var idx = -1;
    for (var i = 0; i < S.timeline.length; i++) {
      if (t >= S.timeline[i][0]) idx = S.timeline[i][1];
    }
    if (idx >= 0) {
      var o = S.overlays[idx];
      blit(fb, o.rows, o.x, o.y);      // the rectangle replaces what is under it
    }
    return fb;
  }

  // ----- fireworks of a new top score -----------------------------------------------------------------------------------

  var fireFrames = null;
  function fireworksPictures() {
    if (!fireFrames) {
      fireFrames = Pictures.FIREWORKS.frames.map(function (rows) { return Framebuffer.fromHexRows(rows, 84); });
    }
    return fireFrames;
  }

  /** Number of steps (pictures shown one after the other) of the whole animation. */
  function fireworksSteps() {
    return Pictures.FIREWORKS.rounds * Pictures.FIREWORKS.frames.length;
  }

  /** The picture t ms after the start: the six pictures in order, then the same six again. */
  function drawFireworks(fb, t) {
    var F = Pictures.FIREWORKS;
    var step = Math.min(Math.floor(t / F.stepMs), fireworksSteps() - 1);
    fb.copyFrom(fireworksPictures()[step % F.frames.length]);
    return fb;
  }

  // ----- soft key ----------------------------------------------------------------------------------------------------

  function drawSoftKey(fb, str) {
    var w = Text.width('B', str);
    Text.draw(fb, 'B', str, Math.floor((84 - w) / 2), SOFTKEY_Y, false);
  }

  // ----- menus -----------------------------------------------------------------------------------------------------------

  // The state of a list is { s, c }: s = index of the item on the top line, c = index of the item with the cursor.
  // Both are plain numbers that the phone keeps between visits of a list [VIDEO B, D].

  function mod(a, n) { return ((a % n) + n) % n; }

  /** The line (0..) of the window the cursor is on; 3 or more means it is outside the window. */
  function cursorLine(state, n) {
    return mod(state.c - state.s, n);
  }

  /**
   * Move the cursor one item (delta = 1 down, -1 up) around the circle. The window only moves when the cursor would
   * leave it: down puts the cursor on the bottom line, up puts it on the top line [VIDEO B, D].
   */
  function moveCursor(state, n, delta) {
    state.c = mod(state.c + delta, n);
    if (n <= LINES) { state.s = 0; return state; }
    if (cursorLine(state, n) >= LINES) state.s = delta > 0 ? mod(state.c - (LINES - 1), n) : state.c;
    return state;
  }

  /**
   * Make the numbers fit a list of n items (the list may have got shorter or longer since the numbers were stored).
   * [EST] A cursor outside the window pulls the window to the top line: footage only shows numbers that fit.
   */
  function fit(state, n) {
    state.s = mod(state.s, n);
    state.c = mod(state.c, n);
    if (n <= LINES) state.s = 0;
    else if (cursorLine(state, n) >= LINES) state.s = state.c;
    return state;
  }

  function drawScrollBar(fb, n, c) {
    var top = LIST_TOP, bottom = LIST_TOP + LINES * LINE_H - 1;      // rows 7..36
    fb.vline(81, top, bottom - top + 1);
    fb.hline(81, top, 2);
    fb.hline(81, bottom, 2);
    var t = LIST_TOP + Math.floor(c * 23 / (n - 1));                 // the thumb follows the cursor item
    fb.vline(83, t, 7);
  }

  /**
   * menu = { items: [text], s, c, header: "8-1-1", softKey: "Select" }
   */
  function drawMenu(fb, menu) {
    fb.clear();
    Text.drawHeader(fb, menu.header);
    var n = menu.items.length;
    for (var j = 0; j < LINES && j < n; j++) {
      var i = mod(menu.s + j, n);
      var y0 = LIST_TOP + LINE_H * j;
      var selected = i === menu.c;
      if (selected) fb.fillRect(0, y0, BAR_W, LINE_H, 1);
      Text.draw(fb, 'B', menu.items[i], 2, y0 + 1, selected);
    }
    drawScrollBar(fb, n, menu.c);
    drawSoftKey(fb, menu.softKey);
    return fb;
  }

  // ----- level ---------------------------------------------------------------------------------------------------------------

  function drawLevel(fb, level) {
    fb.clear();
    Text.draw(fb, 'B', Texts.LEVEL_LABEL, 6, 0, false);
    for (var k = 1; k <= 9; k++) {
      var x0 = 8 * (k - 1);
      fb.hline(x0 + 7, 36, 5);                                  // base
      fb.vline(x0 + 11, 32 - 2 * k, 4 + 2 * k);                 // right edge, rows (32 - 2k) .. 35
      if (k <= level) fb.fillRect(x0 + 6, 31 - 2 * k, 4, 4 + 2 * k);   // filled block, rows (31 - 2k) .. 34
    }
    drawSoftKey(fb, Texts.OK);
    return fb;
  }

  // ----- notes -----------------------------------------------------------------------------------------------------------------

  /**
   * The dotted box in the upper right corner of the "maze selected" note and the tick that is drawn into it t ms
   * after the note appeared [EST art, place and times from VIDEO D].
   */
  function drawNoteIcon(fb, t) {
    var I = Pictures.NOTE_ICON, b = I.box, dx, dy, r, c;
    for (dx = 0; dx < b.w; dx += 2) { fb.set(b.x + dx, b.y, 1); fb.set(b.x + dx, b.y + b.h - 1, 1); }
    for (dy = 0; dy < b.h; dy += 2) { fb.set(b.x, b.y + dy, 1); fb.set(b.x + b.w - 1, b.y + dy, 1); }
    var step = t < I.emptyMs ? 0 : Math.min(I.steps, 1 + Math.floor((t - I.emptyMs) / I.stepMs));
    for (r = 0; r < I.tick.length; r++) {
      for (c = 0; c < I.tick[r].length; c++) {
        var ch = I.tick[r].charAt(c);
        if (ch !== '.' && Number(ch) <= step) fb.set(b.x + I.tickX + c, b.y + I.tickY + r, 1);
      }
    }
  }

  /**
   * lines: array of strings. Each line is large font if it can be, else bold [EST layout for the bold fallback].
   * icon = { t } draws the icon of the "maze selected" note, t ms into the note.
   */
  function drawNote(fb, lines, icon) {
    fb.clear();
    for (var i = 0; i < lines.length; i++) {
      Text.drawNoteLine(fb, lines[i], 0, NOTE_TOP + NOTE_PITCH * i);
    }
    if (icon) drawNoteIcon(fb, icon.t);
    return fb;
  }

  /** "%N" -> the number; "%U" -> the name. */
  function fill(template, params) {
    return template.replace(/%N/g, String(params.n === undefined ? '' : params.n))
      .replace(/%U/g, params.u === undefined ? '' : params.u);
  }

  /** Columns a note with an icon may use for its text [EST]: the box starts at column 68. */
  var ICON_TEXT_WIDTH = 67;

  /**
   * Lines of a note: the text split at "\n", then lines wider than maxW (default the whole screen) broken at spaces,
   * measured with the large font (glyphs it lacks count 8 columns, [EST]).
   */
  function noteLines(template, params, maxW) {
    return Text.wrapLarge(fill(template, params), maxW === undefined ? 84 : maxW);
  }

  // ----- instruction pages ------------------------------------------------------------------------------------------

  var pagesCache = null;
  function instructionPages() {
    if (!pagesCache) {
      var lines = Text.wrap('A', Texts.INSTRUCTION_TEXT, PAGE_WIDTH);
      pagesCache = [];
      for (var i = 0; i < lines.length; i += PAGE_TOP.length) pagesCache.push(lines.slice(i, i + PAGE_TOP.length));
    }
    return pagesCache;
  }

  function drawInstructions(fb, page) {
    fb.clear();
    var lines = instructionPages()[page];
    for (var i = 0; i < lines.length; i++) Text.draw(fb, 'A', lines[i], PAGE_X, PAGE_TOP[i], false);
    drawSoftKey(fb, Texts.NEXT);
    return fb;
  }

  var Screens = {
    drawSplash: drawSplash,
    drawFireworks: drawFireworks,
    fireworksSteps: fireworksSteps,
    drawMenu: drawMenu,
    drawLevel: drawLevel,
    drawNote: drawNote,
    drawNoteIcon: drawNoteIcon,
    drawInstructions: drawInstructions,
    instructionPages: instructionPages,
    noteLines: noteLines,
    moveCursor: moveCursor,
    cursorLine: cursorLine,
    fit: fit,
    fill: fill,
    ICON_TEXT_WIDTH: ICON_TEXT_WIDTH,
    LINES: LINES
  };

  NS.Screens = Screens;
  if (typeof module === 'object' && module.exports) module.exports = Screens;
})();
