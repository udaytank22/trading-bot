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

    // Now update renderRow
    const renderRowRegex = /renderRow={\(([^,]+),\s*([^)]+)\)\s*=>\s*\(\s*(<tr[^>]*>)/g;
    
    content = content.replace(renderRowRegex, (m, item, idx, tr) => {
      // Find out if currentPage exists in this component
      const hasPagination = content.includes('currentPage');
      const hasItemsPerPage = content.includes('itemsPerPage');
      
      const pageVar = hasPagination ? 'currentPage' : '1';
      const itemsVar = hasItemsPerPage ? 'itemsPerPage' : '10';
      
      return m + `\n                <td className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400 font-mono">{(${pageVar} - 1) * ${itemsVar} + ${idx} + 1}</td>`;
    });

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
});

// Ensure config dir exists
const configDir = path.dirname(schemasPath);
if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });

fs.writeFileSync(schemasPath, schemaContent, 'utf8');
console.log(`Created ${schemasPath}`);
