const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const schemasPath = path.join(srcDir, 'config', 'tableSchemas.js');

let schemaContent = `// Auto-generated table schemas\n\n`;

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (!f.endsWith('components\\ui') && f !== 'ui') walkDir(dirPath, callback);
    } else if (dirPath.endsWith('.jsx')) {
      callback(dirPath);
    }
  });
}

walkDir(srcDir, (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  let match;
  let schemaCount = 0;
  const colRegex = /columns={\[\s*([\s\S]*?)\s*\]}/g;

  let imports = [];

  while ((match = colRegex.exec(originalContent)) !== null) {
    schemaCount++;
    const baseName = path.basename(filePath, '.jsx').replace(/[^a-zA-Z0-9]/g, '');
    const schemaName = `${baseName}Schema${schemaCount}`;
    imports.push(schemaName);
    
    // Check if Sr. No is already there
    if (!match[1].includes('"srno"') && !match[1].includes("'srno'")) {
        let columnsInner = `{ key: 'srno', label: 'Sr. No.' },\n            ` + match[1];
        schemaContent += `export const ${schemaName} = [\n  ${columnsInner}\n];\n\n`;
    } else {
        schemaContent += `export const ${schemaName} = [\n  ${match[1]}\n];\n\n`;
    }

    // replace columns prop
    content = content.replace(match[0], `columns={${schemaName}}`);
  }

  if (schemaCount > 0) {
    // Inject import
    const importStr = `import { ${imports.join(', ')} } from '@config/tableSchemas';\n`;
    
    // Insert import after the last import statement
    const lastImportIndex = content.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const endOfLastImport = content.indexOf('\\n', lastImportIndex);
      if (endOfLastImport !== -1) {
         content = content.slice(0, endOfLastImport + 1) + importStr + content.slice(endOfLastImport + 1);
      } else {
         content = importStr + content;
      }
    } else {
      content = importStr + content;
    }

    // Now update renderRow by finding first <td
    const renderRowStartRegex = /renderRow={\(([^,]+),\s*([^)]+)\)\s*=>\s*\(/g;
    let match2;
    let newContent = "";
    let lastIndex = 0;
    while ((match2 = renderRowStartRegex.exec(content)) !== null) {
        newContent += content.substring(lastIndex, match2.index);
        
        const hasPagination = content.includes('currentPage');
        const hasItemsPerPage = content.includes('itemsPerPage');
        
        const pageVar = hasPagination ? '(currentPage ? currentPage : 1)' : '1';
        const itemsVar = hasItemsPerPage ? '(itemsPerPage ? itemsPerPage : 10)' : '10';
        
        const srNoExpr = `(${pageVar} - 1) * ${itemsVar} + ${match2[2]} + 1`;
        const srNoTd = `<td className="px-5 py-3 font-medium text-purple-600 dark:text-purple-400 font-mono">{${srNoExpr}}</td>`;

        const tdIndex = content.indexOf('<td', match2.index);
        
        newContent += content.substring(match2.index, tdIndex) + srNoTd + '\\n                        ';
        lastIndex = tdIndex;
    }
    newContent += content.substring(lastIndex);
    content = newContent;

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
});

// Ensure config dir exists
const configDir = path.dirname(schemasPath);
if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });

fs.writeFileSync(schemasPath, schemaContent, 'utf8');
console.log(`Created ${schemasPath}`);
