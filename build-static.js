// Explicit public-file allowlist: local Python apps and runtime data never ship.
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const output = path.join(root, 'dist');
if (path.dirname(output) !== root) throw new Error('Invalid publish directory');
fs.mkdirSync(output, { recursive: true });
const roots = ['index.html', 'tailwind.css', 'analytics.js', 'accessibility.js',
  'robots.txt', 'sitemap.xml', 'llms.txt', 'llms-full.txt', 'tools', 'learn', 'public', 'services'];
const extensions = new Set(['.html', '.css', '.js', '.svg', '.png', '.jpg', '.jpeg', '.webp', '.ico', '.woff', '.woff2', '.txt', '.xml']);
const expected = new Set();
function copy(relative) {
  const source = path.join(root, relative);
  if (fs.lstatSync(source).isSymbolicLink()) throw new Error(`Symlink excluded: ${relative}`);
  if (fs.statSync(source).isDirectory()) {
    for (const name of fs.readdirSync(source)) copy(path.join(relative, name));
  } else if (extensions.has(path.extname(source))) {
    expected.add(relative);
    const dest = path.join(output, relative);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(source, dest);
  }
}
roots.forEach(copy);
function verify(directory) {
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, item.name);
    if (item.isSymbolicLink()) throw new Error(`Unexpected publish symlink: ${file}`);
    if (item.isDirectory()) verify(file);
    else if (!expected.has(path.relative(output, file))) throw new Error(`Unexpected publish file: ${file}. Review and remove it before publishing.`);
  }
}
verify(output);
console.log(`Static publish directory: dist (${expected.size} public files; no backend)`);
