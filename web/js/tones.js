/*
 * The sounds of Snake II on the Nokia 3310, as the phone's own program plays them. [FW]
 *
 * The phone keeps its tones as tiny scripts: a note byte, the length of the note in timer ticks, loops, an end mark.
 * The program of the game asks for a tone by putting its number in the "event code" of its answer, and the operating
 * system plays that tone when the snake ate or crashed. The three tones of Snake II were decoded the way the phone's
 * interpreter reads them: note byte - 0x40 = note number N, N = 60 is A4 = 440 Hz, and the frequency is the entry N of
 * the phone's table (440, 466, 494, 523 ... Hz, a semitone apart). A tick is 7.96875 ms: the phone divides milliseconds
 * by this number to get ticks (23 places in the program) - level 1 steps at 83 ticks = 661 ms, as measured in footage.
 *
 *   event code 0x1f  the snake ate (an apple or a bonus creature)   2637 Hz for 1 tick
 *   event code 0x20  the snake crashed (second blocked step)         3 x (440 Hz for 2 ticks, silence for 2 ticks)
 *   event code 0x22  the field is full ("YOU WON!")                   523 Hz 15 ticks, silence 3 ticks, 784 Hz 56 ticks
 *
 * Nothing else of the game makes a sound: the bonus creature appearing, running away and the game over note are silent.
 * Key tones: the phone plays the dual tone (DTMF) of the key for as long as the key is held (tone script 3 of the phone
 * starts the tone of the pressed key and stops it when the key goes up). The frequencies are the standard DTMF ones
 * and are also stored in the phone (table at 0x330214).
 *
 * What is not in the data: the loudness. The phone plays Snake II tones at a fixed medium level; the absolute volume
 * and the waveform (a square wave from the buzzer) are estimates, see audio.js and FIDELITY.md.
 */
(function () {
  'use strict';

  var NS = (globalThis.SnakeII = globalThis.SnakeII || {});

  var Tones = {
    TICK_MS: 7.96875,                                   // [FW] one timer tick

    // segments: [frequency in Hz, length in ticks]; frequency 0 = silence
    GAME: {
      eat:   { code: 0x1f, segments: [[2637, 1]] },
      crash: { code: 0x20, segments: [[440, 2], [0, 2], [440, 2], [0, 2], [440, 2], [0, 2]] },
      won:   { code: 0x22, segments: [[523, 15], [0, 3], [784, 56]] }
    },

    // [low group Hz, high group Hz]
    DTMF: {
      '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
      '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
      '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
      '*': [941, 1209], '0': [941, 1336], '#': [941, 1477],
      'A': [697, 1633], 'B': [770, 1633], 'C': [852, 1633], 'D': [941, 1633]
    }
  };

  NS.Tones = Tones;
  if (typeof module === 'object' && module.exports) module.exports = Tones;
})();
