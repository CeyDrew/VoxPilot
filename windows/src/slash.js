'use strict';
// The command strip of a terminal window while Claude Code runs in it (pages/terminal.js): the user's slash commands,
// in their order, each typed into Claude's prompt or sent at once. Settings · Shortcuts edits them; the first nine are
// Ctrl+1…9 in the window.

const DEFAULTS = [
  { cmd: '/compact', label: 'compact', send: true },
  { cmd: '/clear', label: 'clear', send: true },
  { cmd: '/review', label: 'review', send: false },
  { cmd: '/model', label: 'model', send: true },
  { cmd: '/context', label: 'context', send: true },
  { cmd: '/init', label: 'init', send: true },
];
const MAX = 24;

// One shortcut as kept: a command starting with "/", a label (the command without its "/" when empty), whether it's
// sent at once and whether it shows on the strip.
function clean(s) {
  if (!s || typeof s !== 'object') return null;
  const cmd = String(s.cmd || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 300);
  if (!cmd) return null;
  const label = String(s.label || '').trim().slice(0, 40);
  return { cmd, label: label || cmd.replace(/^\//, '').split(/\s+/)[0], send: !!s.send, on: s.on !== false };
}

function createSlash({ settings }) {
  const all = () => {
    const kept = settings.get('slashShortcuts');
    return Array.isArray(kept) ? kept.map(clean).filter(Boolean) : DEFAULTS.map((d) => clean(d));
  };
  return {
    /** Settings' list, all of them. */
    list: () => ({ shortcuts: all() }),
    /** The strip's: the ones shown, in order. */
    shown: () => all().filter((s) => s.on),
    set(list) {
      if (!Array.isArray(list)) return { shortcuts: all() };
      settings.set('slashShortcuts', list.map(clean).filter(Boolean).slice(0, MAX));
      return { shortcuts: all() };
    },
    reset() {
      settings.set('slashShortcuts', null);
      return { shortcuts: all() };
    },
  };
}

module.exports = { createSlash };
