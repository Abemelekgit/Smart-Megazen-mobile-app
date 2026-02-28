/**
 * @file main.js
 * @description Electron main process for the Smart-Megazen Command Center.
 *
 * Creates a full-screen, chromeless-style desktop window with:
 *  - Dark slate background (#0f172a) matching UI theme
 *  - Preload script isolation for security
 *  - DevTools support in development mode
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = process.env.ELECTRON_START_URL != null;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width:           1400,
    height:          900,
    minWidth:        1100,
    minHeight:       700,
    backgroundColor: '#0f172a',
    titleBarStyle:   'hidden',
    vibrancy:        'sidebar',
    webPreferences: {
      nodeIntegration:     false,
      contextIsolation:    true,
      preload:             path.join(__dirname, 'preload.js'),
    },
  });

  const startUrl = isDev
    ? process.env.ELECTRON_START_URL
    : `file://${path.join(__dirname, '../build/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC: Export CSV (placeholder — renderer triggers this)
ipcMain.handle('export-csv', async (_event, data) => {
  const { dialog } = require('electron');
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: `megazen-export-${Date.now()}.csv`,
    filters: [{ name: 'CSV Files', extensions: ['csv'] }],
  });
  if (result.canceled || !result.filePath) return { success: false };
  const fs = require('fs');
  fs.writeFileSync(result.filePath, data, 'utf-8');
  return { success: true, path: result.filePath };
});
