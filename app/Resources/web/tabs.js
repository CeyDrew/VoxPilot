'use strict';
// The app's terminals as tabs in the dashboard's middle (Windows): the orbit map and the terminals take turns there. This
// draws the strip and an empty pane; the app lays the terminal in front (a page of its own) over the pane, so the page
// tells it where the pane is, and hides it (no pane) while something of the page's would be under it: a menu, Source
// Control, a tab or a card being dragged. The Mac app never calls __radar.tabs, so nothing of this shows there.
window.Tabs = (() => {
  const wrap = document.getElementById('mapwrap');
  if (!wrap) return null;
  const send = (msg) => native(msg);
  const ICON_POP = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9 2h5v5M14 2 7.5 8.5M12 10v4H2V4h4"/></svg>';
  const ICON_X = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9"/></svg>';
  const BADGE = { busy: 'working', idle: 'your turn', waiting: 'needs you', ended: 'ended' };
  const stored = (k, d) => {
    try {
      return localStorage.getItem(k) ?? d;
    } catch {
      return d;
    }
  };

  let on = false; // the app has tabs to show (Windows)
  let view = stored('tabs.view', 'map') === 'term' ? 'term' : 'map';
  let state = { tabs: [], active: null, drop: null };
  let renaming = null; // the tab whose name is being edited
  let drag = null; // a tab or a card on the move: { kind, id|sid, x0, y0, moving, index, out }

  // ---------- the parts ----------
  const sw = document.createElement('div');
  sw.id = 'vt-switch';
  sw.hidden = true;
  sw.innerHTML =
    '<button type="button" data-v="map" title="The orbit map" aria-label="The orbit map">' +
    '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="2.3"/><ellipse cx="8" cy="8" rx="6.6" ry="3" transform="rotate(-25 8 8)"/></svg></button>' +
    '<button type="button" data-v="term" title="The terminals, as tabs (Ctrl+Tab: the next one)" aria-label="The terminals, as tabs (Ctrl+Tab: the next one)">' +
    '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="2.5" width="13" height="11" rx="1.2"/><path d="M4.5 6.5l2 1.8-2 1.8M8.5 10.5h3"/></svg><b></b></button>';
  const root = document.createElement('section');
  root.id = 'vt';
  root.hidden = true;
  root.innerHTML =
    '<header class="vt-head"><span class="vt-tag">terminals</span><em class="vt-meta"></em></header>' +
    '<nav class="vt-strip" role="tablist" aria-label="Terminal tabs">' +
    '<div class="vt-tabs"></div><i class="vt-mark" hidden></i></nav>' +
    '<div class="vt-pane"><div class="vt-empty" hidden><b>no open tabs</b><span>Click a session card or drag one here.</span></div>' +
    '<div class="vt-cover" hidden><span></span></div></div>';
  wrap.append(root, sw);
  const strip = root.querySelector('.vt-strip'), list = root.querySelector('.vt-tabs'), mark = root.querySelector('.vt-mark');
  const meta = root.querySelector('.vt-meta');
  const pane = root.querySelector('.vt-pane'), empty = root.querySelector('.vt-empty'), cover = root.querySelector('.vt-cover');
  const ghost = document.createElement('div');
  ghost.id = 'vt-ghost';
  ghost.hidden = true;
  document.body.appendChild(ghost);

  // ---------- the middle: the map or the terminals ----------
  function setView(v) {
    view = v === 'term' ? 'term' : 'map';
    try {
      localStorage.setItem('tabs.view', view);
    } catch {}
    render();
    // The map rests while the terminals are over it.
    if (typeof refreshVisibility === 'function') refreshVisibility();
  }
  const covers = () => on && view === 'term';

  // ---------- drawing ----------
  let drawn = '';
  function render() {
    sw.hidden = !on;
    root.hidden = !covers();
    wrap.classList.toggle('vt-on', covers());
    sw.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === view));
    const waiting = state.tabs.some((t) => t.status === 'waiting');
    const count = sw.querySelector('b');
    count.textContent = state.tabs.length ? String(state.tabs.length) : '';
    sw.classList.toggle('wait', waiting && view !== 'term');
    const n = (st) => state.tabs.filter((t) => t.status === st).length;
    meta.textContent = `${state.tabs.length} tabs · ${n('waiting')} needs you · ${n('idle')} your turn`;
    if (drag && drag.moving) return report();
    const key = JSON.stringify([state.tabs, state.active]);
    if (key !== drawn && !renaming) {
      drawn = key;
      list.innerHTML = state.tabs
        .map((t) => {
          const act = t.id === state.active;
          const badge = !act && BADGE[t.status] ? `<em>${esc(BADGE[t.status])}</em>` : '';
          return (
            `<div class="vt-tab st-${esc(t.status)}${act ? ' on' : ''}" data-id="${esc(t.id)}" role="tab" aria-selected="${act}" title="${esc(t.cwd || '')}">` +
            `<i class="dot"></i><b class="nm no-tr">${esc(t.name)}</b>${badge}` +
            `<button type="button" class="pop" title="Open in a window of its own">${ICON_POP}</button>` +
            `<button type="button" class="x" title="Close the tab (the session keeps running)">${ICON_X}</button></div>`
          );
        })
        .join('');
      const act = state.tabs.find((t) => t.id === state.active);
      strip.dataset.st = act ? act.status : '';
    }
    empty.hidden = !!state.active;
    placeMark(state.drop);
    report();
  }

  // The green line where a tab would go: before the `i`th tab (or after the last).
  function placeMark(i) {
    if (i == null || !covers()) return void (mark.hidden = true);
    const tabsEl = [...list.children].filter((el) => !drag || el.dataset.id !== drag.id);
    const sr = strip.getBoundingClientRect();
    let x;
    if (!tabsEl.length) x = list.getBoundingClientRect().left;
    else if (i >= tabsEl.length) x = tabsEl[tabsEl.length - 1].getBoundingClientRect().right;
    else x = tabsEl[i].getBoundingClientRect().left;
    mark.style.left = `${Math.round(x - sr.left - 1)}px`;
    mark.hidden = false;
  }

  // ---------- where the pane is, for the app ----------
  let sent = '';
  const box = (r) => ({ x: r.left, y: r.top, w: r.width, h: r.height });
  function report() {
    if (!on) return;
    let rect = null, stripBox = null, mids = [], area = null;
    const paused = document.documentElement.classList.contains('paused');
    const wr = wrap.getBoundingClientRect();
    if (wr.width > 40 && wr.height > 40 && wrap.offsetParent !== null) {
      // Something of the page's over the middle (Source Control, Settings…): it's not the app's to cover.
      const mine = (x, y) => {
        const el = document.elementFromPoint(x, y);
        return !!el && wrap.contains(el);
      };
      if (mine(wr.left + wr.width / 2, wr.top + wr.height / 2)) {
        area = box(wr);
        if (covers()) {
          stripBox = box(strip.getBoundingClientRect());
          mids = [...list.children].map((el) => {
            const r = el.getBoundingClientRect();
            return r.left + r.width / 2;
          });
          const pr = pane.getBoundingClientRect();
          const free = !paused && state.active && !(drag && drag.moving) && pr.width > 20 && pr.height > 20;
          if (free && mine(pr.left + 8, pr.top + 8) && mine(pr.right - 8, pr.bottom - 8) && mine(pr.left + pr.width / 2, pr.top + pr.height / 2)) rect = box(pr);
        }
      }
    }
    const msg = { type: 'tabArea', rect, strip: stripBox, mids, area };
    const json = JSON.stringify(msg);
    if (json === sent) return;
    sent = json;
    send(msg);
  }
  new ResizeObserver(report).observe(wrap);
  setInterval(report, 250);

  // ---------- the strip's clicks ----------
  sw.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-v]');
    if (b) setView(b.dataset.v);
  });
  strip.addEventListener('click', (e) => {
    const t = e.target.closest('.vt-tab');
    if (!t) return;
    if (e.target.closest('.x')) return send({ type: 'tabClose', id: t.dataset.id });
    if (e.target.closest('.pop')) return send({ type: 'tabPop', id: t.dataset.id });
  });
  strip.addEventListener('dblclick', (e) => {
    const t = e.target.closest('.vt-tab');
    if (t && !e.target.closest('button, input')) send({ type: 'tabPop', id: t.dataset.id });
  });
  // The middle button closes a tab, as in a browser.
  strip.addEventListener('auxclick', (e) => {
    const t = e.target.closest('.vt-tab');
    if (t && e.button === 1) send({ type: 'tabClose', id: t.dataset.id });
  });

  // A right-click: the tab's menu (the app's, native); its Rename… edits the name here.
  strip.addEventListener('contextmenu', async (e) => {
    const t = e.target.closest('.vt-tab');
    if (!t) return;
    e.preventDefault();
    const id = t.dataset.id;
    let pick = null;
    try {
      pick = await window.webkit.messageHandlers.radar.postMessage({ type: 'tabMenu', id, at: { x: Math.round(e.clientX), y: Math.round(e.clientY) } });
    } catch {}
    if (pick === 'rename') rename(id);
  });
  function rename(id) {
    const t = list.querySelector(`.vt-tab[data-id="${CSS.escape(id)}"]`);
    const nm = t && t.querySelector('.nm');
    if (!nm) return;
    const was = nm.textContent;
    const input = document.createElement('input');
    input.className = 'vt-rename';
    input.value = was;
    input.spellcheck = false;
    renaming = id;
    nm.replaceWith(input);
    input.focus();
    input.select();
    let done = false;
    const finish = (keep) => {
      if (done) return;
      done = true;
      renaming = null;
      const name = input.value.trim();
      drawn = '';
      if (keep && name && name !== was) send({ type: 'tabRename', id, name });
      render();
    };
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') finish(true);
      else if (e.key === 'Escape') finish(false);
    });
    input.addEventListener('blur', () => finish(true));
    input.addEventListener('pointerdown', (e) => e.stopPropagation());
  }

  // ---------- dragging: a tab along the strip or out of it, a session's card onto it ----------
  const inside = (r, x, y) => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  const slot = (x) => [...list.children].filter((el) => el.dataset.id !== drag.id).filter((el) => {
    const r = el.getBoundingClientRect();
    return r.left + r.width / 2 < x;
  }).length;

  function start(e, el, d) {
    if (e.button !== 0 || !on) return false;
    drag = { ...d, x0: e.clientX, y0: e.clientY, moving: false, index: null, out: false, el, pointer: e.pointerId };
    return true;
  }
  strip.addEventListener('pointerdown', (e) => {
    const t = e.target.closest('.vt-tab');
    if (!t || e.target.closest('button')) return;
    if (!start(e, t, { kind: 'tab', id: t.dataset.id, label: t.querySelector('.nm').textContent })) return;
    try {
      t.setPointerCapture(e.pointerId);
    } catch {}
  });
  document.getElementById('sessions')?.addEventListener('pointerdown', (e) => {
    const card = e.target.closest('.card');
    if (!card || e.target.closest('button, a, .lights, .g-chip, input')) return;
    start(e, card, { kind: 'card', sid: card.dataset.key, label: card.querySelector('.nm')?.textContent || '' });
  });
  addEventListener('pointermove', (e) => {
    if (!drag) return;
    if (!drag.moving) {
      if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;
      drag.moving = true;
      try {
        drag.el.setPointerCapture(drag.pointer);
      } catch {}
      document.documentElement.classList.add('vt-dragging');
      if (drag.kind === 'tab') drag.el.classList.add('dragging');
      report();
    }
    const x = e.clientX, y = e.clientY;
    const sr = strip.getBoundingClientRect(), wr = wrap.getBoundingClientRect();
    let hint = '';
    drag.index = null;
    drag.out = false;
    if (covers() && inside(sr, x, y)) {
      drag.index = slot(x);
      hint = drag.kind === 'tab' ? 'move here' : 'open as a tab';
    } else if (inside(wr, x, y)) {
      hint = drag.kind === 'tab' ? '' : 'open as a tab';
    } else if (drag.kind === 'tab') {
      drag.out = true;
      hint = 'open in a window';
    }
    placeMark(drag.index);
    // The pane's cover: the terminal steps aside while something is dragged over it.
    cover.hidden = !(covers() && drag.kind === 'card' && drag.index == null && inside(wr, x, y));
    cover.querySelector('span').textContent = 'open as a tab';
    ghost.hidden = false;
    ghost.classList.toggle('out', drag.out);
    ghost.innerHTML = `<b class="no-tr">${esc(drag.label)}</b>${hint ? `<span>${esc(hint)}</span>` : ''}`;
    ghost.style.transform = `translate(${x + 12}px, ${y + 10}px)`;
  });
  const finish = (e, cancel) => {
    if (!drag) return;
    const d = drag;
    drag = null;
    document.documentElement.classList.remove('vt-dragging');
    d.el.classList.remove('dragging');
    ghost.hidden = true;
    cover.hidden = true;
    mark.hidden = true;
    if (!d.moving) {
      if (d.kind === 'tab' && !cancel) send({ type: 'tabPick', id: d.id });
      return render();
    }
    // A card let go: no click on it (which opens the session wherever it is).
    if (d.kind === 'card') {
      const eat = (ev) => ev.stopPropagation();
      addEventListener('click', eat, { capture: true, once: true });
      setTimeout(() => removeEventListener('click', eat, { capture: true }), 0);
    }
    if (!cancel) {
      const wr = wrap.getBoundingClientRect();
      if (d.kind === 'tab') {
        if (d.index != null) send({ type: 'tabMove', id: d.id, index: d.index });
        else if (d.out) send({ type: 'tabPop', id: d.id, drag: true });
      } else if (d.index != null || inside(wr, e.clientX, e.clientY)) {
        if (!covers()) setView('term');
        send({ type: 'tabOpen', sid: d.sid, ...(d.index != null ? { index: d.index } : {}) });
      }
    }
    drawn = '';
    render();
  };
  addEventListener('pointerup', (e) => finish(e, false));
  addEventListener('pointercancel', (e) => finish(e, true));
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drag && drag.moving) finish(e, true);
  });

  return {
    covers,
    // The app's tabs: `reveal` brings the terminals up in the middle (a terminal opened, picked or brought back).
    update(next) {
      on = true;
      state = { tabs: Array.isArray(next.tabs) ? next.tabs : [], active: next.active || null, drop: next.drop ?? null };
      if (next.reveal && view !== 'term') return setView('term');
      render();
    },
    view: setView,
  };
})();
