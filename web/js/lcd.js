/*
 * LCD painter: the 84 x 48 bit matrix -> canvas.
 *
 * Every LCD pixel is a rectangle (the original window was 841 x 576: 10 x 12 screen pixels per LCD pixel,
 * separated by 1 pixel grid lines in the background colour - Screen.paint drew them with drawLine).
 * Cells are scaled by whole device pixels so nothing is ever blurred, also on high-DPI screens.
 *
 * Skins:
 *   neon  - the colours of the 2021 version: pure green, black pixels
 *   lcd   - the greenish display of the old phones: dark ink, faint unlit pixels, a soft shadow
 */
(function () {
  'use strict';

  var NS = (globalThis.SnakeII = globalThis.SnakeII || {});
  var req = typeof require === 'function';
  var config = NS.config || (req ? require('./config.js') : null);
  var Framebuffer = NS.Framebuffer || (req ? require('./framebuffer.js') : null);

  var SKINS = {
    neon: { name: 'neon', bg: '#00ff00', ink: '#000000', ghost: null, shadow: null },
    lcd: {
      name: 'lcd',
      bg: '#71cd0e',
      ink: '#052a00',
      ghost: 'rgba(5, 42, 0, 0.075)',
      shadow: 'rgba(5, 42, 0, 0.2)'
    }
  };
  var SKIN_ORDER = ['neon', 'lcd'];

  /**
   * How big the cells are. Everything in device pixels, so the result is crisp.
   * @param {number} availW  available width in CSS pixels
   * @param {number} availH  available height in CSS pixels
   * @param {number} dpr     device pixel ratio
   * @returns {{cw:number, ch:number, gap:number, width:number, height:number, cssW:number, cssH:number}}
   */
  function computeLayout(availW, availH, dpr) {
    dpr = dpr > 0 ? dpr : 1;
    availW = isFinite(availW) ? availW : 0;
    availH = isFinite(availH) ? availH : 0;
    var aw = Math.max(1, Math.floor(availW * dpr));
    var ah = Math.max(1, Math.floor(availH * dpr));
    var ratio = config.CELL_H / config.CELL_W;
    var cw = Math.floor(Math.min(aw / config.LCD_W, ah / (config.LCD_H * ratio)));
    if (cw < 1) cw = 1;
    var ch = Math.max(1, Math.round(cw * ratio));
    while (cw > 1 && ch * config.LCD_H > ah) {
      cw--;
      ch = Math.max(1, Math.round(cw * ratio));
    }
    var gap = cw >= 3 ? Math.max(1, Math.round(cw / 10)) : 0;
    var width = cw * config.LCD_W;
    var height = ch * config.LCD_H;
    return { cw: cw, ch: ch, gap: gap, width: width, height: height, cssW: width / dpr, cssH: height / dpr };
  }

  function LCD(canvas, opts) {
    opts = opts || {};
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.skin = SKINS[opts.skin] || SKINS.neon;
    this.layout = null;
    this.dpr = 1;
    this.bg = null; // cached background (colour + unlit pixels)
    this.last = new Framebuffer(config.LCD_W, config.LCD_H);
    this.dirty = true;
  }

  LCD.prototype.setSkin = function (name) {
    var skin = SKINS[name];
    if (!skin || skin === this.skin) return;
    this.skin = skin;
    this.bg = null;
    this.dirty = true;
  };

  LCD.prototype.nextSkin = function () {
    var i = SKIN_ORDER.indexOf(this.skin.name);
    var name = SKIN_ORDER[(i + 1) % SKIN_ORDER.length];
    this.setSkin(name);
    return name;
  };

  /** Fit into the given CSS box. Returns the layout. */
  LCD.prototype.resize = function (availW, availH, dpr) {
    var L = computeLayout(availW, availH, dpr);
    this.dpr = dpr > 0 ? dpr : 1;
    var old = this.layout;
    this.layout = L;
    if (!old || old.width !== L.width || old.height !== L.height) {
      this.canvas.width = L.width;
      this.canvas.height = L.height;
    }
    this.canvas.style.width = L.cssW + 'px';
    this.canvas.style.height = L.cssH + 'px';
    this.bg = null;
    this.dirty = true;
    return L;
  };

  LCD.prototype._buildBackground = function () {
    var L = this.layout;
    var c = document.createElement('canvas');
    c.width = L.width;
    c.height = L.height;
    var g = c.getContext('2d', { alpha: false });
    g.fillStyle = this.skin.bg;
    g.fillRect(0, 0, L.width, L.height);
    if (this.skin.ghost) {
      g.fillStyle = this.skin.ghost;
      for (var y = 0; y < config.LCD_H; y++) {
        for (var x = 0; x < config.LCD_W; x++) {
          g.fillRect(x * L.cw + L.gap, y * L.ch + L.gap, L.cw - L.gap, L.ch - L.gap);
        }
      }
    }
    this.bg = c;
  };

  LCD.prototype.invalidate = function () {
    this.dirty = true;
  };

  /** Paints the matrix. Does nothing when neither the matrix nor the layout/skin changed. */
  LCD.prototype.draw = function (fb) {
    var L = this.layout;
    if (!L) return false;
    if (!this.dirty && this.last.equals(fb)) return false;
    this.last.copyFrom(fb);
    this.dirty = false;

    if (!this.bg) this._buildBackground();
    var ctx = this.ctx;
    ctx.drawImage(this.bg, 0, 0);

    var px = fb.px, w = config.LCD_W, h = config.LCD_H;
    var cw = L.cw, ch = L.ch, gap = L.gap;
    var x, y;

    if (this.skin.shadow) {
      var so = Math.max(1, Math.round(cw / 7));
      ctx.fillStyle = this.skin.shadow;
      for (y = 0; y < h; y++) {
        for (x = 0; x < w; x++) {
          if (px[y * w + x]) ctx.fillRect(x * cw + gap + so, y * ch + gap + so, cw - gap, ch - gap);
        }
      }
    }
    ctx.fillStyle = this.skin.ink;
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        if (px[y * w + x]) ctx.fillRect(x * cw + gap, y * ch + gap, cw - gap, ch - gap);
      }
    }
    return true;
  };

  LCD.SKINS = SKINS;
  LCD.SKIN_ORDER = SKIN_ORDER;
  LCD.computeLayout = computeLayout;

  NS.LCD = LCD;
  if (typeof module === 'object' && module.exports) module.exports = LCD;
})();
