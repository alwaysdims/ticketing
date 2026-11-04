const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = ['index.html', 'admin/index.html', 'src/css/input.css', 'src/js/main.js', 'src/js/admin.js', 'public/favicon.svg'];
let timer;
for (const file of source) {
  fs.watch(path.join(root, file), () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const build = spawn('npm', ['run', 'build'], { cwd: root, shell: true, stdio: 'inherit' });
      build.on('error', console.error);
    }, 200);
  });
}
spawn(process.execPath, [path.join(__dirname, 'serve.js')], { cwd: root, stdio: 'inherit' });
console.log('Sumber dipantau. Refresh browser setelah build.');
