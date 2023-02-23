const { app, BrowserWindow, screen, webFrame, Menu, Tray } = require('electron');
const path = require('path');

const Store = require('electron-store');
const store = new Store();

/* ========= DEV ========= */
if (process.env.NODE_ENV !== 'production') {
  require('electron-reload')(__dirname, {
    electron: require(`${__dirname}/node_modules/electron`)
  });
}
/* ========= /DEV ========= */

let tray = null;
let mainWindow = null;

function createMainWindow () {

  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const windowBoundsDisk = store.get('app_windowBounds');
  const appAlwaysOnTop = store.get('app_alwaysOnTop') ?? false;

  mainWindow = new BrowserWindow({
    minWidth: 420,
    minHeight: 500,
    width: windowBoundsDisk?.width ?? Math.round(width * 0.25),
    height: windowBoundsDisk?.height ?? height,
    x: windowBoundsDisk?.x ?? Math.round(width * 0.75),
    y: windowBoundsDisk?.y ?? 0,
    frame: false,
    alwaysOnTop: appAlwaysOnTop,
    resizable: true,
    movable: true, // Window dragging
    webPreferences: {
      nodeIntegration: true, // Enable Node.js integration in the renderer process
    }
  })

  mainWindow.loadURL('https://chat.openai.com/chat/');

  mainWindow.on('closed', () => {
    mainWindow = null;
  })

  mainWindow.on('minimize', (event) => {
    event.preventDefault();
    mainWindow.hide();
  })

  mainWindow.on('close', (event) => {
    store.set('app_windowBounds', mainWindow.getBounds());
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  })


  /* TRAY */
  tray = new Tray(path.join(__dirname, 'assets/chatGPT_logo.png'));

  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  })
  const zoomMenu = Menu.buildFromTemplate([
    { label: 'Zoom In', accelerator: 'CmdOrCtrl+Plus', click: function() { webFrame.setZoomLevel(webFrame.getZoomLevel() + 1); } },
    { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', click: function() { webFrame.setZoomLevel(webFrame.getZoomLevel() - 1); } },
    { label: 'Reset Zoom', accelerator: 'CmdOrCtrl+0', click: function() { webFrame.setZoomLevel(0); } }
  ]);

  const contextMenu = Menu.buildFromTemplate([
    //{ label: 'Zoom', submenu: zoomMenu },
    {
      label: 'Always on top',
      type: 'checkbox',
      checked: appAlwaysOnTop,
      click: function() {
        let aotValue = !mainWindow.isAlwaysOnTop();
        mainWindow.setAlwaysOnTop(aotValue);
        store.set('app_alwaysOnTop', aotValue);
      }
    },
    { label: 'Restart', click: () => { restartApp() } },
    { label: 'Exit', click: () => { app.isQuitting = true; app.quit() } },
  ])
  tray.setContextMenu(contextMenu);

}

app.on('ready', createMainWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createMainWindow();
  }
})

function restartApp() {
  app.relaunch();
  app.quit();
}

