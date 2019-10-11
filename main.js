const { app, BrowserWindow } = require('electron');

let win;

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({ width: 1145, height: 650, x: 0, y: 0 });

  // and load the index.html of the app.
  win.loadFile('index.html');

  // Open the DevTools.
  // win.webContents.openDevTools();

  // Emitted when the window is closed.
  win.on('closed', () => {
    win = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  app.quit();
});
