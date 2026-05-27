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

  // Fix from './ui'
  content = content.replace(/from\s+["'](?:\.\/|\.\.\/)+ui["']/g, "from '@components/ui'");
  
  // Fix from '../../config' or similar
  content = content.replace(/from\s+["'](?:\.\/|\.\.\/)+config["']/g, "from '@config/constants'"); // Wait, settings imported config.js from root? Actually, constants are in config/constants.js
  
  // We already fixed settings. Let's see if there are other `./ui`
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  }
}

walk(path.join(__dirname, 'src', 'features'), processFile);
