const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function copyIfExists(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

// Clean
fs.rmSync(dist, { recursive: true, force: true });

// Compile Tailwind CSS
fs.mkdirSync(path.join(dist, 'css'), { recursive: true });
execSync(
  `npx @tailwindcss/cli -i src/css/input.css -o dist/css/style.css --minify`,
  { cwd: root, stdio: 'inherit' }
);

// Copy HTML
copyIfExists(path.join(root, 'index.html'), path.join(dist, 'index.html'));
fs.mkdirSync(path.join(dist, 'admin'), { recursive: true });
copyIfExists(path.join(root, 'admin', 'index.html'), path.join(dist, 'admin', 'index.html'));

// Copy JS
copyDir(path.join(root, 'src', 'js'), path.join(dist, 'js'));

// Copy data
copyDir(path.join(root, 'src', 'data'), path.join(dist, 'data'));

// Copy public
copyDir(path.join(root, 'public'), dist);

// Ship only icons used by the pages; Iconify renders locally without API calls.
const iconifySrc = path.join(root, 'node_modules', 'iconify-icon', 'dist', 'iconify-icon.min.js');
copyIfExists(iconifySrc, path.join(dist, 'js', 'iconify-icon.min.js'));
copyIfExists(iconifySrc, path.join(root, 'js', 'iconify-icon.min.js'));

const solar = require('@iconify-json/solar/icons.json');
const html = ['index.html', 'admin/index.html']
  .map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
const names = [...html.matchAll(/<iconify-icon\s+icon="solar:([^"]+)"/g)]
  .map(match => match[1].replace(/\s+/g, ''));
const icons = {};
const aliases = {};
for (const name of new Set(names)) {
  if (solar.icons[name]) icons[name] = solar.icons[name];
  else if (solar.aliases?.[name]) {
    aliases[name] = solar.aliases[name];
    icons[aliases[name].parent] = solar.icons[aliases[name].parent];
  } else {
    console.warn(`[build] Warning: icon solar:${name} not found in bundle, skipping.`);
  }
}

const iconsPayload = `window.IconifyPreload = ${JSON.stringify({ prefix: 'solar', width: solar.width, height: solar.height, icons, aliases })};`;
fs.writeFileSync(path.join(dist, 'js', 'icons.js'), iconsPayload);
fs.mkdirSync(path.join(root, 'js'), { recursive: true });
fs.writeFileSync(path.join(root, 'js', 'icons.js'), iconsPayload);

// Font
const fontSrc = path.join(root, 'node_modules', '@fontsource-variable', 'plus-jakarta-sans', 'files', 'plus-jakarta-sans-latin-wght-normal.woff2');
copyIfExists(fontSrc, path.join(dist, 'fonts', 'plus-jakarta-sans-latin-wght-normal.woff2'));
copyIfExists(fontSrc, path.join(root, 'fonts', 'plus-jakarta-sans-latin-wght-normal.woff2'));

// Also copy root runtime assets for direct GitHub Pages repository root deployment
copyIfExists(path.join(dist, 'css', 'style.css'), path.join(root, 'css', 'style.css'));
copyIfExists(path.join(root, 'public', 'favicon.svg'), path.join(root, 'favicon.svg'));
copyIfExists(path.join(root, 'src', 'js', 'main.js'), path.join(root, 'js', 'main.js'));
copyIfExists(path.join(root, 'src', 'js', 'admin.js'), path.join(root, 'js', 'admin.js'));
copyIfExists(path.join(root, 'src', 'data', 'demo-data.js'), path.join(root, 'data', 'demo-data.js'));

console.log('Build complete: dist/ and root runtime assets synced for GitHub Pages');
