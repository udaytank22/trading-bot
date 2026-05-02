require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const { ipcMain } = require('electron');
let store;
async function initStore() {
  if (store) return;
  const { default: Store } = await import('electron-store');
  store = new Store();
}

initStore();

ipcMain.handle('store-get', async (event, key) => {
  await initStore();
  return store.get(key);
});
ipcMain.handle('store-set', async (event, key, val) => {
  await initStore();
  return store.set(key, val);
});
ipcMain.handle('store-reset', async () => {
  await initStore();
  return store.clear();
});


const key = process.env.GEMINI_API_KEY || '';
const maskedKey = key.length > 8 ? key.substring(0, 8) + '...' : key;
const CONFIG = {
  geminiApiKey: maskedKey,
  geminiModel: process.env.GEMINI_MODEL,
  n8nBaseUrl: process.env.N8N_WEBHOOK_BASE_URL,
  n8nSecret: process.env.N8N_WEBHOOK_SECRET,
  sheetId: process.env.GOOGLE_SHEET_ID,
};
console.log('CONFIG loaded:', CONFIG);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const indexPath = path.join(__dirname, 'dist', 'index.html');
  win.loadFile(indexPath, process.env.INITIAL_HASH ? { hash: process.env.INITIAL_HASH } : {});

  // Automated Walkthrough Execution
  if (process.env.RUN_FULL_TEST) {
    win.webContents.on('did-finish-load', () => {
      setTimeout(async () => {
        try {
          const snap = async (name) => {
            const img = await win.webContents.capturePage();
            const p = path.join(__dirname, '..', 'docs', 'screenshots', name);
            fs.mkdirSync(path.dirname(p), { recursive: true });
            fs.writeFileSync(p, img.toPNG());
            console.log('Saved:', name);
          };
          
          const click = async (selector) => {
            await win.webContents.executeJavaScript(`
              {
                const el = document.querySelector("${selector}");
                if(el) el.click();
              }
            `);
          };

          // 1. Dashboard
          await snap('09_01_dashboard.png');

          // 2. Click Pending Replies
          await click('#pending-replies-card');
          await new Promise(r => setTimeout(r, 800));
          await snap('09_02_pending_inquiries.png');

          // 3. Click View on first inquiry
          await click('.view-btn');
          await new Promise(r => setTimeout(r, 800));
          await snap('09_03_drawer_open.png');

          // 4. Scroll drawer
          await win.webContents.executeJavaScript(`
            {
               const drawers = Array.from(document.querySelectorAll('.custom-scrollbar'));
               if(drawers.length > 1) drawers[1].scrollTop = 300; // 0 is page, 1 is drawer usually natively
            }
          `);
          await new Promise(r => setTimeout(r, 400));
          await snap('09_04_drawer_scrolled.png');

          // 5. Click Approve & Send
          await click('#approve-send-btn');
          await new Promise(r => setTimeout(r, 600));
          await snap('09_05_email_modal.png');

          // 6. Click Edit Email
          await win.webContents.executeJavaScript(`
            {
               const btns = Array.from(document.querySelectorAll('button'));
               const editBtn = btns.find(b => b.innerText.includes('Edit Email'));
               if(editBtn) editBtn.click();
            }
          `);
          await new Promise(r => setTimeout(r, 400));
          await snap('09_06_email_edit.png');

          // 7. Click Send Now
          await win.webContents.executeJavaScript(`
            {
               const btns = Array.from(document.querySelectorAll('button'));
               const sendBtn = btns.find(b => b.innerText.includes('Send Now'));
               if(sendBtn) sendBtn.click();
            }
          `);
          await new Promise(r => setTimeout(r, 2200));
          await snap('09_07_email_success.png');

          // 8. Wait for modal & drawer close
          await new Promise(r => setTimeout(r, 3800));
          await snap('09_08_status_updated.png');

          // 9. Go to Profit Report
          await win.webContents.executeJavaScript(`
            {
               const navs = Array.from(document.querySelectorAll('a'));
               const prNav = navs.find(n => n.innerText.includes('Profit Report'));
               if(prNav) prNav.click();
            }
          `);
          await new Promise(r => setTimeout(r, 600));
          await snap('09_09_profit_report.png');

          // 10. Click Export CSV
          await win.webContents.executeJavaScript(`
            {
               const btns = Array.from(document.querySelectorAll('button'));
               const exportBtn = btns.find(b => b.innerText.includes('Export CSV'));
               if(exportBtn) exportBtn.click();
            }
          `);
          await new Promise(r => setTimeout(r, 600));
          await snap('09_10_export_csv.png');

          // 11. Go to Settings, Change margin, click Save -> Toast appears
          await win.webContents.executeJavaScript(`
            {
               const navs = Array.from(document.querySelectorAll('a'));
               const sNav = navs.find(n => n.innerText.includes('Settings'));
               if(sNav) sNav.click();
            }
          `);
          await new Promise(r => setTimeout(r, 600));
          
          await win.webContents.executeJavaScript(`
            {
               const inputs = Array.from(document.querySelectorAll('input[type="number"]'));
               if(inputs.length > 0) {
                 const nativeSet = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                 nativeSet.call(inputs[0], 25);
                 inputs[0].dispatchEvent(new Event('input', { bubbles: true}));
               }
               
               const sBtn = document.getElementById('save-settings-btn');
               if (sBtn) sBtn.click();
            }
          `);
          await new Promise(r => setTimeout(r, 500));
          await snap('09_11_settings_toast.png');

        } catch (e) {
          console.error(e);
        } finally {
          app.quit();
        }
      }, 3000);
    });
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
