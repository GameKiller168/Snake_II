/*
 * Sound: a few square-wave beeps through WebAudio, like the piezo of the old phones.
 *
 * Browsers only allow audio after a user gesture, so the AudioContext is created in unlock(), which the
 * app calls from key presses and taps. Every call into WebAudio is guarded: a browser without it, a
 * blocked context or a failing resume() must never disturb the game.
 */
(function () {
  'use strict';

  var NS = (globalThis.SnakeII = globalThis.SnakeII || {});

  // [frequency Hz, duration ms] sequences; an optional third entry is the waveform
  var SOUNDS = {
    menu: [[660, 28]],
    start: [[440, 55], [660, 55], [880, 90]],
    pause: [[560, 40], [420, 70]],
    eat: [[880, 45], [1320, 60]],
    bonusSpawn: [[1760, 35], [2093, 35], [1760, 35]],
    bonus: [[784, 55], [988, 55], [1175, 55], [1568, 120]],
    die: [[330, 110], [262, 110], [196, 110], [131, 320, 'sawtooth']],
    win: [[523, 90], [659, 90], [784, 90], [1047, 90], [784, 90], [1047, 240]]
  };

  var VOLUME = 0.07;

  function AudioOut() {
    this.ctx = null;
    this.muted = false;
    this.failed = false;
  }

  AudioOut.prototype.setMuted = function (muted) {
    this.muted = !!muted;
  };

  /** Call from a user gesture (key press, tap). Safe to call as often as you like. */
  AudioOut.prototype.unlock = function () {
    if (this.failed) return;
    try {
      if (!this.ctx) {
        var AC = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!AC) {
          this.failed = true;
          return;
        }
        this.ctx = new AC();
      }
      if (this.ctx.state === 'suspended' && typeof this.ctx.resume === 'function') {
        var p = this.ctx.resume();
        if (p && typeof p.catch === 'function') p.catch(function () {});
      }
    } catch (e) {
      this.failed = true;
    }
  };

  AudioOut.prototype.play = function (name) {
    if (this.muted || this.failed || !this.ctx) return;
    var seq = SOUNDS[name];
    if (!seq) return;
    try {
      var ctx = this.ctx;
      if (ctx.state !== 'running') return;
      var t = ctx.currentTime + 0.005;
      for (var i = 0; i < seq.length; i++) {
        var freq = seq[i][0], dur = seq[i][1] / 1000;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = seq[i][2] || 'square';
        osc.frequency.setValueAtTime(freq, t);
        // a short attack and release keeps the beeps free of clicks
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(VOLUME, t + 0.004);
        gain.gain.setValueAtTime(VOLUME, t + Math.max(0.004, dur - 0.012));
        gain.gain.linearRampToValueAtTime(0.0001, t + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + dur + 0.02);
        t += dur;
      }
    } catch (e) {
      /* never let sound break the game */
    }
  };

  AudioOut.SOUNDS = SOUNDS;
  NS.AudioOut = AudioOut;
  if (typeof module === 'object' && module.exports) module.exports = AudioOut;
})();
