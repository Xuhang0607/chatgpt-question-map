const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8').replace(/^\uFEFF/, ''));
assert.equal(manifest.manifest_version, 3);
assert.deepEqual(manifest.permissions, ['storage']);
for (const name of [...manifest.content_scripts.flatMap(entry => entry.js), 'popup.js']) {
  const result = spawnSync(process.execPath, ['--check', path.join(root, name)], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
}
for (const file of [...Object.values(manifest.icons), manifest.action.default_popup, 'popup.css']) {
  assert.ok(fs.existsSync(path.join(root, file)), `Missing ${file}`);
}
assert.equal(manifest.version, require('../package.json').version);
console.log('Manifest, assets, version, and JavaScript syntax checks passed.');
