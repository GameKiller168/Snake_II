'use strict';

/*
 * Pins the browser language the tests see to English. Node 22 exposes globalThis.navigator, whose language comes from
 * the operating system's locale; without this, the "system" language setting resolves to whatever the machine uses
 * (e.g. LANG=hu_HU) and every expectation written against the English texts fails. Require it before using Phone.
 */

Object.defineProperty(globalThis, 'navigator', {
  value: Object.freeze({ language: 'en-US', languages: Object.freeze(['en-US', 'en']) }),
  configurable: true,
  writable: true
});
