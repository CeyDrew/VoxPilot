'use strict';
// The pages were written for WKWebView on the Mac: they call the app through window.webkit.messageHandlers.<name>
// .postMessage(body), a promise where the Mac's handler replies, and they get a few values the Mac sets before they
// load (the terminals' font, the messages panel's role and friend). This gives them the same over Electron's IPC, so
// they run unchanged, and inserts the theme's colours before they draw (and again when the theme changes).
const { contextBridge, ipcRenderer, webFrame } = require('electron');

const boot = ipcRenderer.sendSync('atl:boot') || {};

// The interface's language (Settings): English as the pages are written, or Turkish through the dictionary main.js
// hands over at boot (src/i18n.js). What a page shows is rewritten as it appears: whole text nodes, titles, placeholders
// and labels that are in the dictionary, nothing else, so chat titles, paths and terminal output stay as they are.
const LANG = boot.lang === 'en' ? 'en' : 'tr';
contextBridge.exposeInMainWorld('__lang', LANG);
if (LANG === 'tr' && boot.dict) translatePages(boot.dict);

function translatePages(dict) {
  const exact = new Map(Object.entries(dict.exact || {}));
  const patterns = (dict.patterns || []).map(([s, r]) => [new RegExp(s), r]);
  const ATTRS = ['title', 'placeholder', 'aria-label'];
  const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'CODE', 'PRE']);
  const OFF = '.xterm, [contenteditable], textarea, .no-tr';
  const tr = (s) => {
    if (!s || s.length > 400 || !/[A-Za-z]/.test(s)) return null;
    const core = s.replace(/\s+/g, ' ').trim();
    let t = exact.get(core);
    if (t === undefined && exact.has(s.trim())) t = exact.get(s.trim());
    if (t === undefined) {
      let cur = core;
      for (const [re, rep] of patterns) if (re.test(cur)) cur = cur.replace(re, rep);
      if (cur !== core) t = cur;
    }
    if (t === undefined || t === core) return null;
    return s.match(/^\s*/)[0] + t + s.match(/\s*$/)[0];
  };
  const text = (n) => {
    const p = n.parentElement;
    if (!p || SKIP.has(p.tagName) || p.closest(OFF)) return;
    const t = tr(n.nodeValue);
    if (t !== null) n.nodeValue = t;
  };
  const attrs = (el) => {
    if (!el.getAttribute) return;
    for (const a of ATTRS) {
      const v = el.getAttribute(a);
      const t = v && tr(v);
      if (t) el.setAttribute(a, t);
    }
  };
  const walk = (root) => {
    if (root.nodeType === 3) return text(root);
    if (root.nodeType !== 1 || SKIP.has(root.tagName) || (root.closest && root.closest(OFF))) return;
    attrs(root);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if (n.nodeType === 3) text(n);
      else attrs(n);
    }
  };
  const seen = new MutationObserver((list) => {
    for (const m of list) {
      if (m.type === 'characterData') text(m.target);
      else if (m.type === 'attributes') attrs(m.target);
      else for (const n of m.addedNodes) walk(n);
    }
  });
  const start = () => {
    walk(document.documentElement);
    seen.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  };
  if (document.documentElement) start();
  else document.addEventListener('readystatechange', start, { once: true });
}

const handlers = {};
for (const name of ['radar', 'cloud', 'git', 'theme', 'overlay', 'messages', 'savers', 'chats', 'archive', 'spend']) {
  handlers[name] = { postMessage: (body) => ipcRenderer.invoke('atl:post', name, body) };
}
contextBridge.exposeInMainWorld('webkit', { messageHandlers: handlers });
// The pages name the computer and the command key by it ("this PC", Ctrl+).
contextBridge.exposeInMainWorld('__platform', process.platform);
if (boot.look) contextBridge.exposeInMainWorld('__terminalLook', boot.look);
if (boot.role) contextBridge.exposeInMainWorld('__MESSAGES_ROLE__', boot.role);
if (boot.friend) contextBridge.exposeInMainWorld('__MESSAGES_FRIEND__', boot.friend);

// A terminal window's line to its shell (pages/terminal.js): only its own channels.
const TERM = /^term:/;
contextBridge.exposeInMainWorld('atl', {
  send: (channel, data) => TERM.test(channel) && ipcRenderer.send(channel, data),
  on: (channel, fn) => TERM.test(channel) && ipcRenderer.on(channel, (_e, data) => fn(data)),
});

// The shortcut wheel: Ctrl and the middle mouse button, anywhere in the app's windows (the Mac opens it with the middle
// button; Ctrl+K still does here too). Neither the page nor the terminal under the pointer gets that press: no orbit
// zoom, no autoscroll, no click sent to the program. Cancelling the pointer press keeps its mouse events from coming.
let wheelPress = false;
const swallow = (e) => {
  e.preventDefault();
  e.stopImmediatePropagation();
};
window.addEventListener('pointerdown', (e) => {
  wheelPress = e.button === 1 && e.ctrlKey;
  if (!wheelPress) return;
  swallow(e);
  ipcRenderer.send('atl:wheel');
}, true);
for (const type of ['mousedown', 'pointerup', 'mouseup', 'auxclick']) {
  window.addEventListener(type, (e) => {
    if (e.button === 1 && wheelPress) swallow(e);
  }, true);
}

// WKWebView draws the Mac's thin overlay scrollbars; Chromium on Windows draws wide light ones, which glare in a dark
// page wherever it left them alone (Source Control's lists). Thin ones in the theme's colours instead: an area that
// hides its own keeps it hidden (its rule is more specific), and the terminal keeps xterm.js's.
webFrame.insertCSS(':where(:not(.xterm *)){scrollbar-width:thin;scrollbar-color:var(--dim2) transparent}', { cssOrigin: 'author' });

// The theme: before the page draws, and again when it changes.
let themeKey = boot.css ? webFrame.insertCSS(boot.css, { cssOrigin: 'author' }) : null;
ipcRenderer.on('atl:theme', (_e, css) => {
  if (themeKey) webFrame.removeInsertedCSS(themeKey);
  themeKey = webFrame.insertCSS(css, { cssOrigin: 'author' });
  window.dispatchEvent(new Event('themechange'));
});
