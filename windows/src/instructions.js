'use strict';
// The user's instructions (Settings · General): their own text, given to the AI sessions they open, as caveman's rules
// are (savers.js). The text is kept in the app's folder (instructions.md); then
// - Claude Code: a SessionStart hook in its settings prints that file into every new session, wherever it runs;
// - Codex: a marked block in ~/.codex/AGENTS.md, read by every Codex session (it has no way to tell where it runs);
// - Gemini and Antigravity: a marked block in ~/.gemini/GEMINI.md, the same way.
// Off (or empty) takes them all out again, the user's own text in those files left as it was.
const fs = require('fs');
const path = require('path');

const MAX = 4000;
const MARK = 'voxpilot/instructions';
const START = '<!-- voxpilot: instructions -->', END = '<!-- /voxpilot: instructions -->';

function createInstructions({ settings, ownDir, claudeDir, codexDir, home }) {
  const file = path.join(ownDir, 'instructions.md');
  const claudeSettings = path.join(claudeDir, 'settings.json');
  const geminiDir = path.join(home, '.gemini');
  const exists = (p) => fs.existsSync(p);

  const text = () => String(settings.get('instructionsText') || '');
  const on = () => settings.get('instructionsOn') !== false;
  const live = () => on() && !!text().trim();

  function readJSON(p) {
    try {
      const t = fs.readFileSync(p, 'utf8');
      if (!t.trim()) return {};
      const j = JSON.parse(t.replace(/^﻿/, ''));
      return j && typeof j === 'object' && !Array.isArray(j) ? j : null;
    } catch (e) {
      return e.code === 'ENOENT' ? {} : null;
    }
  }
  function writeJSON(p, json) {
    const tmp = `${p}.${process.pid}.tmp`;
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(tmp, JSON.stringify(json, null, 2) + '\n');
    try {
      fs.renameSync(tmp, p);
    } catch {
      fs.rmSync(tmp, { force: true });
      fs.writeFileSync(p, JSON.stringify(json, null, 2) + '\n');
    }
  }

  // Git Bash runs Claude Code's hooks: a Windows path with forward slashes, in single quotes.
  const shellQuote = (s) => `'${s.replace(/\\/g, '/').replace(/'/g, `'\\''`)}'`;
  // The app's hook: the one that prints its instructions file (or, from an older app, names it by MARK).
  const fileMark = file.replace(/\\/g, '/').toLowerCase();
  const isOurs = (h) => {
    if (!h || typeof h.command !== 'string') return false;
    const cmd = h.command.replace(/\\/g, '/').toLowerCase();
    return cmd.includes(fileMark) || cmd.includes(MARK);
  };
  function claudeHook() {
    if (!exists(claudeDir)) return;
    const json = readJSON(claudeSettings);
    if (!json) return; // a settings file that isn't JSON is the user's to fix, not overwritten
    const was = JSON.stringify(json);
    const hooks = json.hooks && typeof json.hooks === 'object' ? json.hooks : {};
    const list = (Array.isArray(hooks.SessionStart) ? hooks.SessionStart : [])
      .map((entry) => {
        if (!entry || !Array.isArray(entry.hooks)) return entry;
        const kept = entry.hooks.filter((h) => !isOurs(h));
        return kept.length ? { ...entry, hooks: kept } : null;
      })
      .filter(Boolean);
    if (live()) {
      const command = `cat ${shellQuote(file)}`;
      list.push({ hooks: [{ type: 'command', command, timeout: 5 }] });
    }
    if (list.length) hooks.SessionStart = list;
    else delete hooks.SessionStart;
    if (Object.keys(hooks).length) json.hooks = hooks;
    else delete json.hooks;
    if (JSON.stringify(json) !== was) writeJSON(claudeSettings, json);
  }

  // A notes file (AGENTS.md, GEMINI.md) without the app's block, then with it again while the instructions are on.
  function notesBlock(dir, name) {
    if (!exists(dir)) return;
    const p = path.join(dir, name);
    let old = '';
    try {
      old = fs.readFileSync(p, 'utf8');
    } catch {}
    let t = old;
    const a = t.indexOf(START), b = a >= 0 ? t.indexOf(END, a) : -1;
    if (a >= 0 && b >= 0) {
      let lo = a, hi = b + END.length;
      if (lo > 0 && t[lo - 1] === '\n') lo--;
      if (lo > 0 && t[lo - 1] === '\r') lo--;
      if (t[hi] === '\r') hi++;
      if (t[hi] === '\n') hi++;
      t = t.slice(0, lo) + t.slice(hi);
    }
    if (live()) t = `${t}${t && !t.endsWith('\n') ? '\n' : ''}\n${START}\n${body()}\n${END}\n`;
    if (t === old) return;
    if (!t.trim()) return fs.rmSync(p, { force: true });
    fs.writeFileSync(p, t);
  }

  const body = () => `# The user's instructions (from VoxPilot)\n\nFollow these in this session:\n\n${text().trim()}`;

  function apply() {
    try {
      if (live()) {
        fs.mkdirSync(ownDir, { recursive: true });
        fs.writeFileSync(file, body() + '\n');
      } else fs.rmSync(file, { force: true });
      claudeHook();
      notesBlock(codexDir, 'AGENTS.md');
      notesBlock(geminiDir, 'GEMINI.md');
    } catch (e) {
      console.error('instructions:', e.message);
    }
  }

  const state = () => ({
    text: text(), on: on(), max: MAX,
    tools: [exists(claudeDir) && 'Claude Code', exists(codexDir) && 'Codex', exists(geminiDir) && 'Gemini / Antigravity'].filter(Boolean),
  });

  return {
    state,
    set(body) {
      if (typeof body.text === 'string') settings.set('instructionsText', body.text.slice(0, MAX));
      if (typeof body.on === 'boolean') settings.set('instructionsOn', body.on);
      apply();
      return state();
    },
    /** At launch: the files as the settings say (the user may have changed them, or an older app left them). */
    apply,
  };
}

module.exports = { createInstructions };
