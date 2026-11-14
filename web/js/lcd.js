/*
 * The LCD painter: turns the 84 x 48 bit matrix into canvas pixels.
 *
 * What is measured in footage of real phones [VIDEO]:
 *   - the pixels are not square: 10.008 x 11.967 in the picture, so 10 : 12 (Config.PIXEL_W / PIXEL_H)
 *   - between two rows of dark pixels runs a thin lighter line (about a tenth of the pitch, about 40 % as bright as
 *     the background); between two columns the gap is hardly visible
 * Not measured [EST]: the colours. They depend on the camera and the light (the background is teal-green in one
 * clip, khaki in another), so one typical grey-green is used here. There is exactly one look: no skins.
 *
 * Ghosting [EST]: the liquid crystal of such a panel needs a moment to turn, and longer to relax again. A pixel is
 * not a switch but a level that runs towards on or off: it darkens over a few frames, and clears more slowly, so a
 * moving snake has a soft head and drags a fading trail behind its tail, and a new picture first shows through the
 * old one. The two times are typical of the passive (STN) panels of the late 1990s, not measured on this phone.
 */
(function () {
  'use strict';

  var NS = (globalThis.SnakeII = globalThis.SnakeII || {});
  var Config = NS.Config;
  var Framebuffer = NS.Framebuffer;

  var LOOK = {
    OFF: '#a2ad8a',        // [EST] background of the LCD
    ON: '#222a1c',         // [EST] a dark pixel
    GAP_ROW: 0.40,         // [VIDEO] brightness of the line between two rows of dark pixels (0 = dark, 1 = background)
    GAP_COL: 0.12,         // [VIDEO] hardly visible between columns
    GRID_OFF: 0.06,        // [EST] very faint grid in the empty background
    RISE_MS: 45,           // [EST] a pixel takes this long to go from clear to fully dark (a steady ramp, so the fade-in can be seen)
    FALL_MS: 45,           // [EST] time constant of a pixel clearing: slower than the rise, this is the trail
    CLEAR: 0.03            // [EST] below this a fading pixel is gone
  };

  function mix(a, b, t) {
    // colours as '#rrggbb'; t = share of b
    var pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16), out = 0;
    for (var s = 16; s >= 0; s -= 8) {
      var ca = (pa >> s) & 255, cb = (pb >> s) & 255;
      out = (out << 8) | Math.round(ca + (cb - ca) * t);
    }
    return '#' + ('000000' + out.toString(16)).slice(-6);
  }

  function Lcd(canvas) {
    this.canvas = canvas;
    this.pw = Config.PIXEL_W;
    this.ph = Config.PIXEL_H;
    canvas.width = Config.LCD_W * this.pw;
    canvas.height = Config.LCD_H * this.ph;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.cell = this.makeCell();
    this.back = this.makeBackground();
    this.last = new Framebuffer(Config.LCD_W, Config.LCD_H);
    this.level = new Float32Array(Config.LCD_W * Config.LCD_H);   // how dark every pixel is right now, 0 .. 1
    this.at = 0;
    this.settled = true;
    this.valid = false;
  }

  function newCanvas(w, h) {
    var c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  /** One dark pixel with its thin lighter lines at the bottom and the right edge. */
  Lcd.prototype.makeCell = function () {
    var pw = this.pw, ph = this.ph;
    var c = newCanvas(pw, ph), x = c.getContext('2d');
    x.fillStyle = LOOK.ON;
    x.fillRect(0, 0, pw, ph);
    x.fillStyle = mix(LOOK.ON, LOOK.OFF, LOOK.GAP_ROW);
    x.fillRect(0, ph - 1, pw, 1);
    x.fillStyle = mix(LOOK.ON, LOOK.OFF, LOOK.GAP_COL);
    x.fillRect(pw - 1, 0, 1, ph - 1);
    return c;
  };

  Lcd.prototype.makeBackground = function () {
    var pw = this.pw, ph = this.ph, w = Config.LCD_W * pw, h = Config.LCD_H * ph;
    var c = newCanvas(w, h), x = c.getContext('2d');
    x.fillStyle = LOOK.OFF;
    x.fillRect(0, 0, w, h);
    x.fillStyle = mix(LOOK.OFF, LOOK.ON, LOOK.GRID_OFF);
    for (var j = 1; j <= Config.LCD_H; j++) x.fillRect(0, j * ph - 1, w, 1);
    for (var i = 1; i <= Config.LCD_W; i++) x.fillRect(i * pw - 1, 0, 1, h);
    return c;
  };

  function clock() {
    return globalThis.performance && typeof globalThis.performance.now === 'function' ? globalThis.performance.now() : Date.now();
  }

  /** Let every pixel run towards where the matrix wants it; false once they all have arrived. */
  Lcd.prototype.settle = function (px, ms) {
    var level = this.level, step = ms / LOOK.RISE_MS, fall = 1 - Math.exp(-ms / LOOK.FALL_MS), moving = false;
    for (var i = 0; i < level.length; i++) {
      var goal = px[i] ? 1 : 0, now = level[i];
      if (now === goal) continue;
      if (goal > now) now = Math.min(goal, now + step);              // darkening: a steady ramp
      else now += (goal - now) * fall;                                // clearing: a long tail
      if (Math.abs(goal - now) < LOOK.CLEAR) now = goal; else moving = true;
      level[i] = now;
    }
    return moving;
  };

  /**
   * Paint the matrix, with the ghosts of the pictures before it; returns false (and does nothing) if what is on the
   * glass is the picture already and nothing is still fading.
   */
  Lcd.prototype.draw = function (fb, now) {
    if (now === undefined) now = clock();
    var changed = !this.valid || !this.last.equals(fb);
    if (!changed && this.settled) { this.at = now; return false; }
    var ms = this.valid ? Math.min(Math.max(now - this.at, 0), 100) : 1e6;
    this.at = now;
    this.settled = !this.settle(fb.px, ms);
    var ctx = this.ctx, pw = this.pw, ph = this.ph, w = fb.w, level = this.level;
    ctx.drawImage(this.back, 0, 0);
    for (var y = 0; y < fb.h; y++) {
      for (var x = 0; x < w; x++) {
        var dark = level[y * w + x];
        if (dark <= 0) continue;
        if (dark < 1) ctx.globalAlpha = dark;
        ctx.drawImage(this.cell, x * pw, y * ph);
        if (dark < 1) ctx.globalAlpha = 1;
      }
    }
    this.last.copyFrom(fb);
    this.valid = true;
    return true;
  };

  Lcd.LOOK = LOOK;
  NS.Lcd = Lcd;
})();
