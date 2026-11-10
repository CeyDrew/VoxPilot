'use strict';
// A chat or terminal window (main.js opens it, terminals.js runs its shell): xterm.js on the theme's palette, the way
// VS Code draws its terminal; typing and resizing go to the app, its output comes back. The strip on top shows the
// session's name and status from the dashboard's data.
(() => {
  const css = () => getComputedStyle(document.documentElement);
  const token = (k, d) => css().getPropertyValue(k).trim() || d;
  const palette = () => {
    const a = (i) => token(`--a${i}`, undefined);
    return {
      background: token('--code-bg', '#251200'), foreground: token('--code-fg', '#f5ebe0'), cursor: token('--code-cursor', '#f88008'),
      cursorAccent: token('--caret-text', '#1a0d00'), selectionBackground: token('--selection', '#f88008'), selectionForeground: token('--selection-text', '#1a0d00'),
      black: a(0), red: a(1), green: a(2), yellow: a(3), blue: a(4), magenta: a(5), cyan: a(6), white: a(7),
      brightBlack: a(8), brightRed: a(9), brightGreen: a(10), brightYellow: a(11), brightBlue: a(12), brightMagenta: a(13), brightCyan: a(14), brightWhite: a(15),
    };
  };
  const term = new Terminal({
    fontFamily: '"MesloLGS NF", "CaskaydiaCove Nerd Font", "Cascadia Mono", Consolas, monospace',
    fontSize: 14, lineHeight: 1.1, cursorBlink: true, scrollback: 10000, allowProposedApi: true,
    // Text never fades into its background (Claude's diffs paint lines green and red), as the Mac app's terminals do.
    minimumContrastRatio: 4.5, theme: palette(),
  });
  const fit = new FitAddon.FitAddon();
  term.loadAddon(fit);
  term.loadAddon(new Unicode11Addon.Unicode11Addon());
  term.unicode.activeVersion = '11';
  term.loadAddon(new WebLinksAddon.WebLinksAddon((e, uri) => atl.send('term:open', uri)));
  term.open(document.getElementById('term'));
  try {
    const webgl = new WebglAddon.WebglAddon();
    webgl.onContextLoss(() => webgl.dispose());
    term.loadAddon(webgl);
  } catch {}
  const size = () => ({ cols: term.cols, rows: term.rows });
  const refit = () => {
    // A tab that isn't on screen has no size: fitting it would hand the shell a terminal a few columns wide.
    const box = document.getElementById('term');
    if (box.clientWidth < 120 || box.clientHeight < 60) return;
    try {
      fit.fit();
    } catch {}
  };
  refit();
  new ResizeObserver(refit).observe(document.getElementById('term'));
  addEventListener('resize', refit);
  addEventListener('focus', () => {
    refit();
    term.focus();
  });
  document.addEventListener('visibilitychange', () => !document.hidden && refit());
  addEventListener('themechange', () => (term.options.theme = palette()));
  term.onResize(({ cols, rows }) => atl.send('term:resize', { cols, rows }));
  term.onData((data) => atl.send('term:input', data));
  // The AI tool running in this window, as the app tells it (term:info), for the keys it needs.
  let tool = null, claudeHere = false;
  // Claude Code's command strip (Settings · Shortcuts): a chip per shortcut while Claude runs here; a click, or Ctrl+1…9
  // for the first nine, types the command into Claude's prompt, and sends it too when the shortcut says so.
  const strip = document.getElementById('cmds');
  let cuts = [], stripKey = '';
  const fire = (i) => {
    const s = cuts[i];
    if (!s || strip.hidden) return false;
    term.focus();
    atl.send('term:input', s.cmd);
    // Enter a moment later, as a key of its own: Claude takes a command and its Enter in one write as pasted text.
    if (s.send) setTimeout(() => atl.send('term:input', '\r'), 120);
    const chip = strip.querySelector(`[data-i="${i}"]`);
    if (chip) {
      chip.classList.add('fired');
      setTimeout(() => chip.classList.remove('fired'), 450);
    }
    return true;
  };
  const showStrip = (on, list) => {
    const key = on ? JSON.stringify(list) : '';
    if (key === stripKey) return;
    stripKey = key;
    cuts = on ? list : [];
    strip.hidden = !on;
    strip.textContent = '';
    if (!on) return refit();
    cuts.forEach((s, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.i = i;
      b.className = s.send ? 'send' : '';
      b.title = s.cmd + (s.send ? ' · sent at once' : ' · typed, Enter to send');
      b.append(s.label);
      if (i < 9) {
        const k = document.createElement('kbd');
        k.textContent = `Ctrl+${i + 1}`;
        b.append(k);
      }
      b.onclick = () => fire(i);
      strip.append(b);
    });
    const gap = document.createElement('span');
    gap.className = 'gap';
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'add';
    add.textContent = '+ add';
    add.title = 'Add a shortcut (Settings · Shortcuts)';
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'edit';
    edit.textContent = 'customize';
    edit.title = 'Edit the shortcuts (Settings · Shortcuts)';
    add.onclick = edit.onclick = () => atl.send('term:settings');
    strip.append(more, gap, add, edit);
    refit();
    layoutStrip();
  };
  strip.addEventListener('mousedown', (e) => e.preventDefault());
  // What doesn't fit on the strip (a narrow window, many shortcuts) goes under its "⋯ N more" button, in a list that
  // opens below it; "+ add" goes there too. The keys stay as they are.
  const more = document.createElement('button');
  more.type = 'button';
  more.className = 'more';
  more.hidden = true;
  const menu = document.getElementById('cmds-menu');
  const closeMenu = () => {
    menu.hidden = true;
    more.classList.remove('open');
  };
  const layoutStrip = () => {
    closeMenu();
    if (strip.hidden) return;
    const chips = [...strip.querySelectorAll('button[data-i]')];
    const add = strip.querySelector('.add');
    for (const c of chips) c.hidden = false;
    more.hidden = true;
    if (add) add.hidden = false;
    if (strip.scrollWidth <= strip.clientWidth) return;
    if (add) add.hidden = true;
    more.hidden = false;
    let shown = chips.length;
    do {
      more.textContent = `⋯ ${chips.length - shown + 1} more`;
      chips[--shown].hidden = true;
    } while (shown > 0 && strip.scrollWidth > strip.clientWidth);
    more.textContent = `⋯ ${chips.length - shown} more`;
  };
  new ResizeObserver(() => layoutStrip()).observe(strip);
  more.onclick = () => {
    if (!menu.hidden) return closeMenu();
    menu.textContent = '';
    for (const c of strip.querySelectorAll('button[data-i][hidden]')) {
      const i = Number(c.dataset.i), s = cuts[i];
      const b = document.createElement('button');
      b.type = 'button';
      b.className = s.send ? 'send' : '';
      b.title = c.title;
      const name = document.createElement('span');
      name.textContent = s.label;
      b.append(name);
      if (i < 9) {
        const k = document.createElement('kbd');
        k.textContent = `Ctrl+${i + 1}`;
        b.append(k);
      }
      b.onclick = () => {
        closeMenu();
        fire(i);
      };
      menu.append(b);
    }
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'add';
    add.textContent = '+ add';
    add.onclick = () => {
      closeMenu();
      atl.send('term:settings');
    };
    menu.append(add);
    const r = more.getBoundingClientRect();
    menu.style.top = `${Math.round(r.bottom + 4)}px`;
    menu.style.left = `${Math.round(Math.min(r.left, innerWidth - 220))}px`;
    menu.hidden = false;
    more.classList.add('open');
  };
  menu.addEventListener('mousedown', (e) => e.preventDefault());
  // Anywhere else, or the window going to the back, closes it (Esc is Claude's: it would stop its work).
  addEventListener('mousedown', (e) => !menu.hidden && !menu.contains(e.target) && e.target !== more && closeMenu(), true);
  addEventListener('blur', closeMenu);
  // Copy-on-select, as on the Mac: dragging or double-clicking a selection copies it to the clipboard on mouse release,
  // shows the "COPIED N CHARS" badge in the HUD, and keeps the selection highlighted.
  let mouseDown = false, pendingCopy = false, copyTimer = 0;
  const copiedEl = document.getElementById('copied') || (() => {
    const el = document.createElement('span');
    el.id = 'copied';
    el.hidden = true;
    const hud = document.getElementById('hud');
    if (hud) hud.insertBefore(el, document.getElementById('dash'));
    return el;
  })();
  const showCopied = (n) => {
    if (!copiedEl || !(n > 0)) return;
    copiedEl.textContent = `COPIED ${n} CHAR${n === 1 ? '' : 'S'}`;
    copiedEl.hidden = false;
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => (copiedEl.hidden = true), 2200);
  };
  const copySelection = () => {
    if (!term.hasSelection()) return false;
    const text = term.getSelection();
    if (!text) return false;
    atl.send('term:copy', text);
    showCopied(text.length);
    return true;
  };
  document.getElementById('term').addEventListener('mousedown', (e) => {
    if (e.button === 0) {
      mouseDown = true;
      pendingCopy = false;
    }
  }, true);
  term.onSelectionChange(() => {
    if (!term.hasSelection()) {
      pendingCopy = false;
      return;
    }
    if (mouseDown) pendingCopy = true;
    else copySelection();
  });
  addEventListener('mouseup', () => {
    if (!mouseDown) return;
    mouseDown = false;
    if (pendingCopy && term.hasSelection()) {
      pendingCopy = false;
      copySelection();
    }
  });
  // Ctrl+C copies when something is selected (else it interrupts), Ctrl+V pastes: Windows Terminal's keys. The copy
  // goes through the app, as the page's clipboard API refuses a window without focus. Ctrl+V only keeps xterm.js from
  // sending ^V: the browser's own paste follows and xterm.js takes it (pasting here as well put everything in twice).
  term.attachCustomKeyEventHandler((e) => {
    if (e.type !== 'keydown' || !e.ctrlKey || e.altKey) return true;
    const k = e.key.toLowerCase();
    // Ctrl+1…9: the command strip's shortcuts, while Claude Code runs here.
    if (!e.shiftKey && /^Digit[1-9]$/.test(e.code) && fire(Number(e.code.slice(5)) - 1)) {
      e.preventDefault();
      return false;
    }
    if (k === 'c' && term.hasSelection()) {
      e.preventDefault();
      copySelection();
      return false;
    }
    // Ctrl+N (a new terminal), Ctrl+K (the shortcut wheel) and Ctrl+W (close the window: what runs in it goes on) are
    // the app's, as ⌘N, ⌘K and ⌘W are on the Mac: left unhandled, they reach its menu instead of the shell. Antigravity
    // approves its subagents' steps with Ctrl+K, so while it runs here the key is its own (the wheel is still Ctrl and
    // the middle mouse button away).
    if (k === 'k' && tool === 'Antigravity') return true;
    if (!e.shiftKey && (k === 'n' || k === 'k' || k === 'w')) return false;
    return k !== 'v';
  });
  // A picture on the clipboard and no text: the paste carries nothing xterm.js can type, so the program is handed the
  // key it reads the clipboard's picture with: Alt+V for Claude Code on Windows, else Ctrl+V's own ^V.
  // Files copied in File Explorer are no picture: the app reads their paths (the page can't) and they're pasted
  // quoted, as text, which Claude Code takes an image's path as the image from.
  document.addEventListener('paste', (e) => {
    const d = e.clipboardData;
    if (!d || d.getData('text/plain')) return;
    if (![...d.items].some((i) => i.kind === 'file')) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    atl.send('term:clipFiles');
  }, true);
  atl.on('term:clipFiles', (paths) => {
    if (Array.isArray(paths) && paths.length) return term.paste(paths.map((p) => (/\s/.test(p) ? `"${p}"` : p)).join(' ') + ' ');
    atl.send('term:input', claudeHere ? '\x1bv' : '\x16');
  });
  atl.on('term:data', (data) => term.write(data));
  atl.on('term:exit', () => term.write('\r\n\x1b[2m[ended]\x1b[0m\r\n'));
  const STATUS = { busy: ['WORKING', '--accent'], idle: ['YOUR TURN', '--cyan'], waiting: ['NEEDS YOU', '--warn'], terminal: ['TERMINAL', '--cyan'], ended: ['ENDED', '--ended'] };
  atl.on('term:info', (i) => {
    tool = i.tool || null;
    claudeHere = !!i.claude && i.status !== 'ended';
    showStrip(!!i.claude && i.status !== 'ended', i.shortcuts || []);
    document.getElementById('title').textContent = i.title || 'terminal';
    document.title = `${i.title || 'terminal'} · VoxPilot`;
    const [label, color] = STATUS[i.status] || ['', '--dim'];
    document.getElementById('status').textContent = label;
    document.getElementById('where').textContent = i.cwd || '';
    document.body.style.setProperty('--st', `var(${color})`);
  });
  document.getElementById('hud').addEventListener('mousedown', (e) => e.preventDefault());
  // A tab on the dashboard opens in a window of its own; a window goes back to being a tab.
  const dashBtn = document.getElementById('dash');
  atl.on('term:mode', ({ docked }) => {
    dashBtn.textContent = docked ? 'window' : 'tab';
    dashBtn.title = docked ? 'Open in a window of its own (this keeps running)' : 'Put it back as a tab on the dashboard';
    document.body.classList.toggle('docked', !!docked);
  });
  dashBtn.onclick = () => {
    term.focus();
    atl.send('term:dashboard');
  };
  document.getElementById('end').onclick = () => atl.send('term:end');
  term.focus();
  atl.send('term:ready', size());
})();
