/*
 * The LCD painter: turns the 84 x 48 bit matrix into canvas pixels.
 *
 * What is measured in footage of real phones [VIDEO]:
 *   - the pixels are not square: 10.008 x 11.967 in the picture, so 10 : 12 (Config.PIXEL_W / PIXEL_H)
 *   - between two rows of dark pixels runs a thin lighter line (about a tenth of the pitch, about 40 % as bright as
 *     the background); between two columns the gap is hardly visible
 * Not measured [EST]: the colours. They depend on the camera and the light (the background is teal-green in one
 * clip, khaki in another), so one typical grey-green is used here. There is exactly one look: no skins.
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
    GRID_OFF: 0.06         // [EST] very faint grid in the empty background
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

  /** Paint the matrix; returns false (and does nothing) if it is the one that is already shown. */
  Lcd.prototype.draw = function (fb) {
    if (this.valid && this.last.equals(fb)) return false;
    var ctx = this.ctx, pw = this.pw, ph = this.ph, w = fb.w, px = fb.px;
    ctx.drawImage(this.back, 0, 0);
    for (var y = 0; y < fb.h; y++) {
      for (var x = 0; x < w; x++) {
        if (px[y * w + x]) ctx.drawImage(this.cell, x * pw, y * ph);
      }
    }
    this.last.copyFrom(fb);
    this.valid = true;
    return true;
  };

  Lcd.LOOK = LOOK;
  NS.Lcd = Lcd;
})();
