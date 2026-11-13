/*
 * Include after style.css and before main.js:
 * <link rel="stylesheet" href="css/notice.css">
 * <script src="js/notice.js"></script>
 * In main.js, after the page has loaded its elements, call:
 * NS.Notice.show({ container: document.querySelector('main.unit') });
 */
(function () {
  'use strict';

  var NS = (globalThis.SnakeII = globalThis.SnakeII || {});
  var KEY = 'snake2.notice';
  var TEXT = {
    title: 'Saved on this device',
    body: "Snake II keeps your game and your top score in this browser's local storage, so you can close the page and come back any time to continue where you left off. Nothing is sent anywhere.",
    button: 'OK'
  };

  function shouldShow(storage) {
    try {
      if (storage === undefined) storage = globalThis.localStorage;
      return !!storage && storage.getItem(KEY) !== '1';
    } catch (ignore) {
      return true;
    }
  }

  function show(options) {
    var storage;
    var doc = globalThis.document;
    var card;
    var icon;
    var copy;
    var title;
    var body;
    var button;
    var timer;
    options = options || {};
    if (!shouldShow(options.storage)) return null;
    if (!doc || !options.container || !doc.createElement) return null;
    try {
      storage = options.storage === undefined ? globalThis.localStorage : options.storage;
    } catch (ignore) {
      storage = null;
    }

    card = doc.createElement('aside');
    card.className = 'notice';
    card.setAttribute('role', 'note');
    card.setAttribute('aria-label', TEXT.title);
    icon = doc.createElement('span');
    icon.className = 'notice-icon';
    icon.setAttribute('aria-hidden', 'true');
    copy = doc.createElement('div');
    copy.className = 'notice-copy';
    title = doc.createElement('strong');
    title.className = 'notice-title';
    title.textContent = TEXT.title;
    body = doc.createElement('span');
    body.className = 'notice-body';
    body.textContent = TEXT.body;
    button = doc.createElement('button');
    button.className = 'notice-button';
    button.type = 'button';
    button.textContent = TEXT.button;
    copy.appendChild(title);
    copy.appendChild(body);
    card.appendChild(icon);
    card.appendChild(copy);
    card.appendChild(button);
    options.container.appendChild(card);

    function dismiss() {
      try {
        if (storage) storage.setItem(KEY, '1');
      } catch (ignore) { /* A blocked store should not block dismissal. */ }
      card.className += ' notice-leaving';
      globalThis.setTimeout(function () {
        if (card.parentNode) card.parentNode.removeChild(card);
      }, 300);
    }
    button.addEventListener('click', dismiss);
    card.addEventListener('keydown', function (event) {
      if (event.stopPropagation) event.stopPropagation();
    });
    timer = globalThis.setTimeout(function () {
      card.className += ' notice-visible';
    }, 1200);
    card._noticeTimer = timer;
    return card;
  }

  NS.Notice = { TEXT: TEXT, shouldShow: shouldShow, show: show };
  if (typeof module === 'object' && module.exports) module.exports = NS.Notice;
})();
