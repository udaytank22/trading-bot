const fs = require('fs');

const filesToUpdate = [
  "c:\\Users\\HP\\Desktop\\trading-bot\\web\\src\\features\\settings\\components\\ClientsTab.jsx",
  "c:\\Users\\HP\\Desktop\\trading-bot\\web\\src\\features\\settings\\components\\DocumentsTab.jsx",
  "c:\\Users\\HP\\Desktop\\trading-bot\\web\\src\\features\\settings\\components\\ProductsTab.jsx",
  "c:\\Users\\HP\\Desktop\\trading-bot\\web\\src\\features\\settings\\components\\VehiclesTab.jsx",
  "c:\\Users\\HP\\Desktop\\trading-bot\\web\\src\\features\\inquiries\\InquiriesPage.jsx",
  "c:\\Users\\HP\\Desktop\\trading-bot\\web\\src\\features\\documents\\DocumentsPage.jsx",
  "c:\\Users\\HP\\Desktop\\trading-bot\\web\\src\\components\\ui\\pageToolbar.jsx"
];

let replaced = 0;
for (const file of filesToUpdate) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    const newContent = content.replace(/d="M12 4v16m8-8H4"/g, 'd="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"');
    if (content !== newContent) {
      fs.writeFileSync(file, newContent, 'utf8');
      console.log('Updated', file);
      replaced++;
    }
  }
}
console.log('Total files updated:', replaced);
