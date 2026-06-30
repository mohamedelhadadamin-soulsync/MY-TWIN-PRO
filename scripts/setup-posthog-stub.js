const fs = require('fs');
const path = require('path');

const stubDir = path.join(__dirname, '..', 'patches', '@posthog', 'core');
const targetDir = path.join(__dirname, '..', 'node_modules', '@posthog', 'core');

// إنشاء المجلد الهدف
fs.mkdirSync(targetDir, { recursive: true });

// نسخ الملفات
const files = ['surveys.js', 'index.js'];
files.forEach(file => {
  const src = path.join(stubDir, file);
  const dest = path.join(targetDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`  ✅ Copied ${file} to node_modules/@posthog/core/`);
  }
});
