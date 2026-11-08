'use strict';
// What a new terminal starts in its folder (Settings · Interface): nothing (a plain shell), one of the AI coding tools
// installed here, or a command of the user's own. Claude starts as a chat (the chats list follows it); any other runs in
// the terminal, and the shell stays when it exits.
const { execFile } = require('child_process');
const { which } = require('./terminals');
const { AI_TOOLS } = require('./runaways');

const WIN = process.platform === 'win32';
const TOOLS = { claude: 'Claude Code', ...AI_TOOLS };
const quote = (s) => (WIN ? `'${String(s).replace(/'/g, "''")}'` : `'${String(s).replace(/'/g, `'\\''`)}'`);

// The program behind a tool's name: its .exe or npm's .cmd, never npm's .ps1 (Windows' script policy refuses those).
const names = (id) => (WIN ? [`${id}.exe`, `${id}.cmd`] : [id]);
const programNow = (id) => names(id).map(which).find(Boolean) || null;
const lookUp = (name) =>
  new Promise((resolve) =>
    execFile(WIN ? 'where.exe' : 'which', [name], { encoding: 'utf8', windowsHide: true, timeout: 5000 }, (err, out) =>
      resolve(err ? null : out.split(/\r?\n/).map((s) => s.trim()).find(Boolean) || null)));
async function programLater(id) {
  for (const n of names(id)) {
    const p = await lookUp(n);
    if (p) return p;
  }
  return null;
}

function createStarter({ settings }) {
  // The tools installed here, looked up all at once in the background: { id: path }. Again when Settings opens, for one
  // installed since.
  let paths = null;
  const scan = () =>
    Promise.all(Object.keys(TOOLS).map(async (id) => [id, await programLater(id)])).then((all) => {
      paths = Object.fromEntries(all.filter(([, p]) => p));
      return paths;
    });
  let scanning = scan();
  const program = (id) => (paths ? paths[id] || null : programNow(id));

  // The choice: 'none', a tool's id or 'custom' (with its command). Unset: Claude when it's installed, else nothing.
  function choice() {
    const c = settings.get('startWith');
    if (c === 'none' || c === 'custom' || TOOLS[c]) return c;
    return program('claude') ? 'claude' : 'none';
  }

  const state = () => ({
    startWith: choice(),
    tools: Object.keys(paths || {}).map((id) => ({ id, name: TOOLS[id] })),
    command: settings.get('startCommand') || '',
  });

  return {
    /**
     * How a new terminal starts: { claudeArgs: [] } for a Claude chat, { command } for another tool or the user's own,
     * {} for a plain shell. `plain` (Shift on + new terminal) asks for a plain shell whatever the choice.
     */
    start(plain) {
      if (plain) return {};
      const c = choice();
      if (c === 'none') return {};
      if (c === 'claude') return { claudeArgs: [] };
      if (c === 'custom') {
        const cmd = String(settings.get('startCommand') || '').trim();
        return cmd ? { command: cmd } : {};
      }
      const exe = program(c);
      return exe ? { command: WIN ? `& ${quote(exe)}` : quote(exe) } : {};
    },
    /** Settings' row: the choice, the tools to pick from and the custom command. */
    async state() {
      await (scanning = scanning.then(scan));
      return state();
    },
    set({ startWith, command }) {
      if (startWith === 'none' || startWith === 'custom' || TOOLS[startWith]) settings.set('startWith', startWith);
      if (typeof command === 'string') settings.set('startCommand', command.slice(0, 500));
      return state();
    },
  };
}

module.exports = { createStarter };
