'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Notice = require('../js/notice.js');

function fakeDocument() {
  function Element(tag) {
    this.tagName = tag;
    this.children = [];
    this.attributes = {};
    this.listeners = {};
    this.parentNode = null;
    this.className = '';
  }
  Element.prototype.setAttribute = function (key, value) { this.attributes[key] = value; };
  Element.prototype.appendChild = function (child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  };
  Element.prototype.removeChild = function (child) {
    this.children.splice(this.children.indexOf(child), 1);
    child.parentNode = null;
  };
  Element.prototype.addEventListener = function (name, fn) { this.listeners[name] = fn; };
  return { createElement: function (tag) { return new Element(tag); } };
}

function storageWith(value, throwing) {
  return {
    value: value || null,
    getItem: function () { if (throwing) throw new Error('blocked'); return this.value; },
    setItem: function (key, next) { if (throwing) throw new Error('blocked'); this.key = key; this.value = next; }
  };
}

test('exports the exact notice copy and checks acknowledgement safely', function () {
  assert.deepEqual(Notice.TEXT, {
    title: 'Saved on this device',
    body: "Snake II keeps your game and your top score in this browser's local storage, so you can close the page and come back any time to continue where you left off. Nothing is sent anywhere.",
    button: 'OK'
  });
  assert.equal(Notice.shouldShow(storageWith('1')), false);
  assert.equal(Notice.shouldShow(storageWith(null)), true);
  assert.equal(Notice.shouldShow(null), false);
  assert.equal(Notice.shouldShow(storageWith(null, true)), true);
});

test('show builds an accessible in-flow card, delays reveal, and dismisses into storage', function () {
  const oldDocument = globalThis.document;
  const oldTimeout = globalThis.setTimeout;
  const timers = [];
  globalThis.document = fakeDocument();
  globalThis.setTimeout = function (fn, delay) { timers.push({ fn, delay }); return timers.length; };
  try {
    const container = globalThis.document.createElement('main');
    const storage = storageWith(null);
    const card = Notice.show({ container: container, storage: storage });
    assert.ok(card);
    assert.equal(container.children[0], card);
    assert.equal(card.attributes.role, 'note');
    assert.equal(card.attributes['aria-label'], Notice.TEXT.title);
    assert.equal(card.children[1].children[0].textContent, Notice.TEXT.title);
    const button = card.children[2];
    assert.equal(button.textContent, 'OK');
    assert.equal(timers[0].delay, 1200);
    timers[0].fn();
    assert.ok(card.className.indexOf('notice-visible') >= 0);
    let stopped = false;
    card.listeners.keydown({ stopPropagation: function () { stopped = true; } });
    assert.equal(stopped, true);
    button.listeners.click();
    assert.equal(storage.key, 'snake2.notice');
    assert.equal(storage.value, '1');
    timers[1].fn();
    assert.equal(container.children.length, 0);
    assert.equal(Notice.show({ container: container, storage: storage }), null);
  } finally {
    globalThis.document = oldDocument;
    globalThis.setTimeout = oldTimeout;
  }
});

test('show still renders and dismisses when storage access throws', function () {
  const oldDocument = globalThis.document;
  const oldTimeout = globalThis.setTimeout;
  const timers = [];
  globalThis.document = fakeDocument();
  globalThis.setTimeout = function (fn) { timers.push(fn); };
  try {
    const container = globalThis.document.createElement('main');
    const card = Notice.show({ container: container, storage: storageWith(null, true) });
    assert.ok(card);
    card.children[2].listeners.click();
    assert.doesNotThrow(function () { timers[1](); });
    assert.equal(container.children.length, 0);
  } finally {
    globalThis.document = oldDocument;
    globalThis.setTimeout = oldTimeout;
  }
});
