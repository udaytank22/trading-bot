const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    let fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath, callback);
    } else {
      callback(fullPath);
    }
  });
}

function processFile(filePath) {
  if (!filePath.endsWith('.jsx') && !filePath.endsWith('.js')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Fix from '../ui' to from '@components/ui'
  content = content.replace(/from\s+["'](?:\.\.\/)+ui["']/g, "from '@components/ui'");
  
  // Fix Duplicate fill attribute in ContactModal
  if (filePath.endsWith('ContactModal.jsx')) {
    content = content.replace(/fill="none"\s*\n\s*viewBox="0 0 20 20"\s*\n\s*fill="currentColor"/g, 'fill="none"\n                     viewBox="0 0 20 20"');
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  }
}

walk(path.join(__dirname, 'src', 'features'), processFile);
