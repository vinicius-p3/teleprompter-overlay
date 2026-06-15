const { app, BrowserWindow, ipcMain, globalShortcut, screen } = require('electron');
const path = require('path');

let win;
let clickThrough = false;

function createWindow() {
  const { width } = screen.getPrimaryDisplay().workAreaSize;
  const winWidth = 720;
  const winHeight = 440;

  win = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: Math.round((width - winWidth) / 2),
    y: 90,
    minWidth: 340,
    minHeight: 200,
    frame: false,
    transparent: true,
    resizable: true,
    hasShadow: false,
    skipTaskbar: false,
    backgroundColor: '#00000000',
    title: 'Teleprompter',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,            // isola o renderer do Node (defesa em profundidade)
      webSecurity: true,
      // Mantém a rolagem rodando mesmo quando o overlay perde o foco (você no Meet).
      backgroundThrottling: false,
    },
  });

  win.loadFile('index.html');

  // Mantém acima de tudo, inclusive janelas em tela cheia (Meet apresentando).
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // Bloqueia qualquer tentativa de abrir nova janela ou navegar para fora do app.
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  win.webContents.on('will-redirect', (e) => e.preventDefault());

  win.on('closed', () => { win = null; });
}

function send(name, value) {
  if (win && !win.isDestroyed()) win.webContents.send('shortcut', { name, value });
}

function registerShortcuts() {
  // Atalhos globais — funcionam mesmo quando o foco está no Google Meet.
  globalShortcut.register('CommandOrControl+Alt+Space', () => send('playpause'));
  globalShortcut.register('CommandOrControl+Alt+Up', () => send('faster'));
  globalShortcut.register('CommandOrControl+Alt+Down', () => send('slower'));
  globalShortcut.register('CommandOrControl+Alt+R', () => send('restart'));

  // Liga/desliga o modo clique-através (cliques passam para o Meet).
  globalShortcut.register('CommandOrControl+Alt+L', () => {
    if (!win) return;
    clickThrough = !clickThrough;
    win.setIgnoreMouseEvents(clickThrough, { forward: true });
    send('clickthrough', clickThrough);
  });

  // Esconde/mostra o overlay rapidamente.
  globalShortcut.register('CommandOrControl+Alt+H', () => {
    if (!win) return;
    if (win.isVisible()) win.hide();
    else win.show();
  });
}

app.whenReady().then(() => {
  createWindow();
  registerShortcuts();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => globalShortcut.unregisterAll());

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ---- IPC: comandos vindos da interface ----
ipcMain.on('win:minimize', () => win && win.minimize());
ipcMain.on('win:close', () => win && win.close());

ipcMain.on('win:aot', (_e, value) => {
  if (win) win.setAlwaysOnTop(!!value, 'screen-saver');
});

ipcMain.on('win:protect', (_e, value) => {
  // setContentProtection(true) faz a janela NÃO aparecer em capturas/compartilhamento de tela.
  if (win) win.setContentProtection(!!value);
});

ipcMain.on('win:clickthrough', (_e, value) => {
  if (!win) return;
  clickThrough = !!value;
  win.setIgnoreMouseEvents(clickThrough, { forward: true });
});
