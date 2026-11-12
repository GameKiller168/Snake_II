/*
 * The LCD as a plain 84 x 48 bit matrix. Everything the game shows is first drawn into one of these,
 * then the LCD painter turns it into canvas pixels. That keeps the game logic and the sprite engine
 * free of any DOM and lets the tests compare frames bit by bit.
 */
(function () {
  'use strict';

  var NS = (globalThis.SnakeII = globalThis.SnakeII || {});

  function Framebuffer(w, h) {
    this.w = w || 84;
    this.h = h || 48;
    this.px = new Uint8Array(this.w * this.h);
  }

  Framebuffer.prototype.clear = function () {
    this.px.fill(0);
    return this;
  };

  Framebuffer.prototype.set = function (x, y, on) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.px[y * this.w + x] = on === 0 || on === false ? 0 : 1;
  };

  Framebuffer.prototype.get = function (x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.px[y * this.w + x];
  };

  Framebuffer.prototype.fillRect = function (x, y, w, h, on) {
    for (var j = 0; j < h; j++) {
      for (var i = 0; i < w; i++) this.set(x + i, y + j, on);
    }
  };

  Framebuffer.prototype.clearRect = function (x, y, w, h) {
    this.fillRect(x, y, w, h, 0);
  };

  Framebuffer.prototype.hline = function (x, y, len) {
    this.fillRect(x, y, len, 1, 1);
  };

  Framebuffer.prototype.vline = function (x, y, len) {
    this.fillRect(x, y, 1, len, 1);
  };

  Framebuffer.prototype.copyFrom = function (other) {
    this.px.set(other.px);
  };

  Framebuffer.prototype.equals = function (other) {
    if (this.w !== other.w || this.h !== other.h) return false;
    var a = this.px, b = other.px;
    for (var i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  };

  /** One string of hex digits per row, 4 pixels per digit, leftmost pixel = most significant bit. */
  Framebuffer.prototype.toHexRows = function () {
    var rows = [];
    for (var y = 0; y < this.h; y++) {
      var s = '';
      for (var x = 0; x < this.w; x += 4) {
        var n = 0;
        for (var k = 0; k < 4; k++) n = (n << 1) | this.get(x + k, y);
        s += n.toString(16);
      }
      rows.push(s);
    }
    return rows;
  };

  Framebuffer.fromHexRows = function (rows, w) {
    var fb = new Framebuffer(w || 84, rows.length);
    for (var y = 0; y < rows.length; y++) {
      for (var d = 0; d < rows[y].length; d++) {
        var n = parseInt(rows[y].charAt(d), 16);
        for (var k = 0; k < 4; k++) fb.set(d * 4 + k, y, (n >> (3 - k)) & 1);
      }
    }
    return fb;
  };

  Framebuffer.prototype.toAscii = function () {
    var out = [];
    for (var y = 0; y < this.h; y++) {
      var s = '';
      for (var x = 0; x < this.w; x++) s += this.get(x, y) ? '#' : '.';
      out.push(s);
    }
    return out.join('\n');
  };

  NS.Framebuffer = Framebuffer;
  if (typeof module === 'object' && module.exports) module.exports = Framebuffer;
})();
