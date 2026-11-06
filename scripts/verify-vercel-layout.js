const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));

assert.equal(config.framework, null, 'Vercel framework must stay explicit null');
assert.equal(config.outputDirectory, 'dist', 'Static output must be dist');
assert.equal(config.buildCommand, 'npm run build', 'Build command mismatch');
assert.ok(fs.existsSync(path.join(root, 'api', 'register.js')), 'Root API function missing');
assert.ok(fs.existsSync(path.join(root, 'api', 'admin', 'me.js')), 'Root admin API function missing');
assert.ok(fs.existsSync(path.join(root, 'dist', 'index.html')), 'Build output missing dist/index.html');
assert.ok(!fs.existsSync(path.join(root, 'dist', 'api')), 'Build must not move API into dist');

console.log('Vercel layout PASS: root api/ preserved, dist/ static output present');
