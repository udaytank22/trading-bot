const fs = require('fs');

let content = fs.readFileSync('src/config/tableSchemas.js', 'utf8');
const lines = content.split('\n');
let newLines = [];
let insideArray = false;
let seenKeys = new Set();

for (let line of lines) {
    if (line.includes('export const') && line.match(/=\s*\[/)) {
        insideArray = true;
        seenKeys = new Set();
        newLines.push(line);
        continue;
    }
    if (insideArray && line.includes('];')) {
        insideArray = false;
        newLines.push(line);
        continue;
    }
    if (insideArray) {
        // extract key
        const match = line.match(/key:\s*['"]([^'"]+)['"]/);
        if (match) {
            const key = match[1];
            if (seenKeys.has(key)) {
                // skip duplicate
                continue;
            }
            seenKeys.add(key);
        }
        newLines.push(line);
    } else {
        newLines.push(line);
    }
}

fs.writeFileSync('src/config/tableSchemas.js', newLines.join('\n'), 'utf8');
console.log('Fixed schemas');
