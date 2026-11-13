/*
 * The random number generator of the phone's operating system, which Snake II calls for every random
 * decision (apple position, bonus creature position, creature type).
 *
 *   seed = (seed * 0x625f + 0x3623) mod 0xfff1;  result = seed        [FW]
 *
 * The phone seeds it from its clock, so no sequence is "the" sequence: any seed is as original as another.
 */
(function () {
  'use strict';

  var NS = (globalThis.SnakeII = globalThis.SnakeII || {});

  function Rng(seed) {
    this.seed = (seed >>> 0) % 0xfff1;
  }

  /** The next number, 0 .. 0xfff0. */
  Rng.prototype.next = function () {
    this.seed = (this.seed * 0x625f + 0x3623) % 0xfff1;
    return this.seed;
  };

  /** A seed from the clock / the browser's entropy, for real games. */
  Rng.fromClock = function () {
    var s;
    if (globalThis.crypto && globalThis.crypto.getRandomValues) {
      var a = new Uint16Array(1);
      globalThis.crypto.getRandomValues(a);
      s = a[0];
    } else {
      s = Math.floor(Math.random() * 0x10000);
    }
    return new Rng(s);
  };

  NS.Rng = Rng;
  if (typeof module === 'object' && module.exports) module.exports = Rng;
})();
