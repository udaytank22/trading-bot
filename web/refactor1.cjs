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

  // Paths
  content = content.replace(/from\s+["'](?:\.\.\/)+components\/ui\/([^"']+)["']/g, "from '@components/ui/$1'");
  content = content.replace(/from\s+["'](?:\.\.\/)+components\/layout\/([^"']+)["']/g, "from '@components/layout/$1'");
  content = content.replace(/from\s+["'](?:\.\.\/)+components\/chat\/([^"']+)["']/g, "from '@components/chat/$1'");
  content = content.replace(/from\s+["'](?:\.\.\/)+data\/([^"']+)["']/g, "from '@data/$1'");
  content = content.replace(/from\s+["'](?:\.\.\/)+utils\/([^"']+)["']/g, "from '@utils/$1'");
  content = content.replace(/from\s+["'](?:\.\.\/)+services\/([^"']+)["']/g, "from '@services/$1'");
  
  // Specific component fixes
  content = content.replace(/from\s+["']\.\/components\/inquiryTable["']/g, "from './components/InquiryTable'");
  content = content.replace(/from\s+["']\.\/components\/inquiryKanban["']/g, "from './components/InquiryKanban'");
  content = content.replace(/from\s+["']\.\/components\/supplyTable["']/g, "from './components/SupplyTable'");
  content = content.replace(/from\s+["']\.\/components\/pOTable["']/g, "from './components/POTable'");
  content = content.replace(/from\s+["']\.\/components\/employeeTable["']/g, "from './components/EmployeeTable'");
  content = content.replace(/from\s+["']\.\/components\/accountTable["']/g, "from './components/AccountTable'");
  content = content.replace(/from\s+["']\.\/components\/profitTable["']/g, "from './components/ProfitTable'");

  content = content.replace(/from\s+["']\.\.\/components\/inquiryTable["']/g, "from './components/InquiryTable'");
  content = content.replace(/from\s+["']\.\.\/components\/inquiryKanban["']/g, "from './components/InquiryKanban'");
  content = content.replace(/from\s+["']\.\.\/components\/supplyTable["']/g, "from './components/SupplyTable'");
  content = content.replace(/from\s+["']\.\.\/components\/pOTable["']/g, "from './components/POTable'");
  content = content.replace(/from\s+["']\.\.\/components\/employeeTable["']/g, "from './components/EmployeeTable'");
  content = content.replace(/from\s+["']\.\.\/components\/accountTable["']/g, "from './components/AccountTable'");
  content = content.replace(/from\s+["']\.\.\/components\/profitTable["']/g, "from './components/ProfitTable'");

  content = content.replace(/from\s+["']\.\.\/components\/([a-zA-Z0-9]+)["']/g, (match, p1) => {
    // If it's something like addInquiryModal, make it modals/AddInquiryModal
    if (p1.endsWith('Modal')) return `from './modals/${p1.charAt(0).toUpperCase() + p1.slice(1)}'`;
    if (p1.endsWith('Drawer')) return `from './drawers/${p1.charAt(0).toUpperCase() + p1.slice(1)}'`;
    return match;
  });
  
  content = content.replace(/from\s+["']\.\/components\/([a-zA-Z0-9]+)["']/g, (match, p1) => {
    if (p1.endsWith('Modal')) return `from './modals/${p1.charAt(0).toUpperCase() + p1.slice(1)}'`;
    if (p1.endsWith('Drawer')) return `from './drawers/${p1.charAt(0).toUpperCase() + p1.slice(1)}'`;
    return match;
  });

  // Context
  if (content.includes('useContext(AppContext)') || content.includes('useAppContext()')) {
    content = content.replace(/import\s*\{\s*AppContext\s*\}\s*from\s*["'](?:\.\.\/)+context["'];?/g, "");
    content = content.replace(/import\s*\{\s*useAppContext\s*\}\s*from\s*["'](?:\.\.\/)+context["'];?/g, "");
    
    // Add import
    if (!content.includes("from '@context'")) {
        content = "import { useAuth, useUI, useData } from '@context';\n" + content;
    }

    const replaceContext = (match, p1) => {
      let vars = p1.split(',').map(v => v.trim()).filter(v => v);
      let authVars = vars.filter(v => ['isAuthenticated', 'currentUser', 'setCurrentUser', 'login', 'logout'].includes(v));
      let uiVars = vars.filter(v => ['isSidebarOpen', 'theme', 'activeCall', 'toggleSidebar', 'toggleTheme', 'startCall', 'endCall'].includes(v));
      let dataVars = vars.filter(v => ['inquiriesData', 'setInquiriesData', 'supplyData', 'setSupplyData', 'purchaseOrdersData', 'setPurchaseOrdersData', 'employeesData', 'setEmployeesData', 'documentsData', 'setDocumentsData', 'accountsData', 'setAccountsData', 'invoicesData', 'setInvoicesData'].includes(v));
      
      let res = '';
      if (authVars.length) res += `const { ${authVars.join(', ')} } = useAuth();\n  `;
      if (uiVars.length) res += `const { ${uiVars.join(', ')} } = useUI();\n  `;
      if (dataVars.length) res += `const { ${dataVars.join(', ')} } = useData();\n  `;
      return res.trim();
    };

    content = content.replace(/const\s+\{\s*([^}]+)\s*\}\s*=\s*(?:React\.)?useContext\(AppContext\);/g, replaceContext);
    content = content.replace(/const\s+\{\s*([^}]+)\s*\}\s*=\s*useAppContext\(\);/g, replaceContext);
  }
  
  // Formatters
  content = content.replace(/import\s*\{\s*formatINR,\s*formatDateString\s*\}\s*from\s*['"](?:\.\.\/)+services\/marginEngine['"];?/g, "import { formatINR, formatDateString } from '@utils/formatters';");
  content = content.replace(/import\s*\{\s*formatINR\s*\}\s*from\s*['"](?:\.\.\/)+services\/marginEngine['"];?/g, "import { formatINR } from '@utils/formatters';");
  content = content.replace(/import\s*\{\s*formatDateString\s*\}\s*from\s*['"](?:\.\.\/)+services\/marginEngine['"];?/g, "import { formatDateString } from '@utils/formatters';");

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  }
}

console.log('Running script...');
walk(path.join(__dirname, 'src', 'features'), processFile);
walk(path.join(__dirname, 'src', 'components', 'layout'), processFile);
