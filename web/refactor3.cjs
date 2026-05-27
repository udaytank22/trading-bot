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

  content = content.replace(/from\s+["'](?:\.\.\/)+components\/ui["']/g, "from '@components/ui'");
  content = content.replace(/from\s+["'](?:\.\.\/)+utils\/swal["']/g, "from '@utils/swal'");
  content = content.replace(/from\s+["'](?:\.\.\/)+utils\/excelUtils["']/g, "from '@utils/excelUtils'");
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  }
}

walk(path.join(__dirname, 'src', 'features'), processFile);
walk(path.join(__dirname, 'src', 'components'), processFile);
