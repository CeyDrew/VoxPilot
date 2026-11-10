'use strict';
// The app in the notification area, where it stays when the dashboard is closed: its icon says how the sessions are
// (a dot in their status colour, blinking while one waits for the user), a click brings the dashboard or puts it away,
// and its menu lists the sessions by status, each opening its terminal, and quits the app for good.
const path = require('path');
const { Tray, Menu, nativeImage } = require('electron');

const ICONS = path.join(__dirname, '..', 'pages', 'tray');
// The dot's colour and the menu's order: the most pressing status first (the dashboard's colours, app.js STATUS).
const ORDER = ['waiting', 'idle', 'busy'];
const HEADINGS = { waiting: 'Waiting for you', idle: 'Your turn', busy: 'Working' };

function createTray({ T, onToggle, onShow, onOpen, onQuit, title }) {
  const icons = {};
  const icon = (name) => icons[name] || (icons[name] = nativeImage.createFromPath(path.join(ICONS, `${name}.png`)));
  const tray = new Tray(icon('tray'));
  tray.setToolTip('VoxPilot');
  tray.on('click', () => onToggle());

  let counts = { busy: 0, waiting: 0, idle: 0 }, groups = { busy: [], waiting: [], idle: [] }, menuKey = '', blink = null, lit = false;
  const top = () => ORDER.find((s) => counts[s] > 0) || null;
  const paint = () => tray.setImage(icon(top() ? `tray-${top()}` : 'tray'));

  // A session waiting for the user: the dot blinks, as its card pulses on the dashboard.
  const setBlink = (on) => {
    if (on === !!blink) return;
    if (!on) {
      clearInterval(blink);
      blink = null;
      return paint();
    }
    blink = setInterval(() => {
      lit = !lit;
      tray.setImage(icon(lit ? 'tray-waiting' : 'tray'));
    }, 650);
  };

  const buildMenu = () => {
    const items = [{ label: T('Open the dashboard'), click: () => onShow() }];
    // The sessions one under another, under their status; a click opens that one's terminal.
    for (const status of ORDER) {
      const list = groups[status];
      if (!list.length) continue;
      items.push({ type: 'separator' }, { label: T(HEADINGS[status]), enabled: false });
      for (const s of list.slice(0, 12)) items.push({ label: `   ${s.title}`, click: () => onOpen(s.sid) });
      if (list.length > 12) items.push({ label: `   +${list.length - 12}`, click: () => onShow() });
    }
    items.push({ type: 'separator' }, { label: T('Quit VoxPilot'), click: () => onQuit() });
    tray.setContextMenu(Menu.buildFromTemplate(items));
  };

  const tooltip = () => {
    const parts = [];
    if (counts.waiting) parts.push(`${counts.waiting} ${T('waiting for you')}`);
    if (counts.idle) parts.push(`${counts.idle} ${T('your turn')}`);
    if (counts.busy) parts.push(`${counts.busy} ${T('working')}`);
    return ['VoxPilot', ...parts].join(' · ');
  };

  buildMenu();
  return {
    /** The live sessions (engine.live()): the icon, its tooltip and the menu follow them. */
    update(live) {
      const next = { busy: 0, waiting: 0, idle: 0 };
      const nextGroups = { busy: [], waiting: [], idle: [] };
      for (const s of live || []) {
        if (next[s.status] === undefined) continue;
        next[s.status]++;
        nextGroups[s.status].push({ sid: s.sessionId, title: title(s) });
      }
      for (const list of Object.values(nextGroups)) list.sort((a, b) => a.title.localeCompare(b.title));
      const key = JSON.stringify(nextGroups);
      if (key === menuKey) return;
      menuKey = key;
      counts = next;
      groups = nextGroups;
      tray.setToolTip(tooltip());
      buildMenu();
      if (!blink) paint();
      setBlink(counts.waiting > 0);
    },
    /** Once, the first time the dashboard goes to the tray: it's still running there. */
    hint(title, content) {
      tray.displayBalloon({ title, content, iconType: 'info' });
    },
    destroy() {
      setBlink(false);
      tray.destroy();
    },
  };
}

module.exports = { createTray };
