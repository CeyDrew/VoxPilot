'use strict';
// npm run release: puts this version out on GitHub, where the installed apps update from (main.js, electron-updater).
// It builds the installer, then makes the release v<version> with the three files an update needs: the installer, its
// blockmap (only the changed parts download) and latest.yml (the version and the installer's sha512, which every app
// reads). The notes are CHANGELOG.md's section of this version. The commit it's built from must be on GitHub already.
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.join(__dirname, '..');
const repo = path.join(root, '..');
const { version } = require(path.join(root, 'package.json'));
const tag = `v${version}`;
const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], ...opts }).trim();
const fail = (msg) => {
  console.error(`release: ${msg}`);
  process.exit(1);
};

// The release points at a commit people can see: nothing uncommitted, and main pushed.
if (run('git', ['status', '--porcelain'])) fail('there are uncommitted changes · commit them first');
run('git', ['fetch', 'origin', 'main', '--quiet']);
if (run('git', ['rev-parse', 'HEAD']) !== run('git', ['rev-parse', 'origin/main'])) fail('this commit is not on origin/main · push it first');
try {
  run('gh', ['release', 'view', tag], { stdio: 'ignore' });
  fail(`${tag} is out already · raise the version in package.json`);
} catch (e) {
  if (e.status === undefined) throw e;
}

// This version's notes: its section of the changelog, without its heading.
const lines = fs.readFileSync(path.join(repo, 'CHANGELOG.md'), 'utf8').split(/\r?\n/);
const from = lines.findIndex((l) => l.trim() === `## ${version}`);
const to = from < 0 ? -1 : lines.findIndex((l, i) => i > from && l.startsWith('## '));
const section = from < 0 ? '' : lines.slice(from + 1, to < 0 ? undefined : to).join('\n').trim();
if (!section) fail(`CHANGELOG.md has no "## ${version}" section`);

execFileSync('npm', ['run', 'dist'], { cwd: root, stdio: 'inherit', shell: true });

const dist = path.join(root, 'dist');
const yml = fs.readFileSync(path.join(dist, 'latest.yml'), 'utf8');
const file = (/^path:\s*(.+)$/m.exec(yml) || [])[1];
if (!yml.includes(`version: ${version}`) || !file) fail('latest.yml is not this version\'s');
const installer = path.join(dist, file.trim());
const files = [installer, `${installer}.blockmap`, path.join(dist, 'latest.yml')];
for (const f of files) if (!fs.existsSync(f)) fail(`missing ${f}`);

const notes = path.join(os.tmpdir(), `voxpilot-${version}-notes.md`);
fs.writeFileSync(notes, `${section}\n\nWindows kurulum dosyası: **${path.basename(installer)}**\n`);
run('gh', ['release', 'create', tag, ...files, '--target', 'main', '--title', `VoxPilot ${version}`, '--notes-file', notes, '--latest'], { stdio: 'inherit' });
fs.rmSync(notes, { force: true });
console.log(`release: ${tag} is out · the installed apps find it within 15 minutes`);
