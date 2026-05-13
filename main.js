const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    title: 'Sovereign Intelligence Dashboard',
    backgroundColor: '#0a0f14',
    show: false, // Don't show until ready to prevent white flashing
    icon: path.join(__dirname, 'public/favicon.ico')
  });

  // Load the local Next.js server
  mainWindow.loadURL('http://localhost:3000');

  // Show window when the page is ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window close
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', () => {
  // Wait a few seconds for the Next.js server to fully boot before creating the window
  setTimeout(createWindow, 2000);
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
