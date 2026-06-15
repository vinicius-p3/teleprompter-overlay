const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('tp', {
  minimize: () => ipcRenderer.send('win:minimize'),
  close: () => ipcRenderer.send('win:close'),
  setAlwaysOnTop: (v) => ipcRenderer.send('win:aot', v),
  setContentProtection: (v) => ipcRenderer.send('win:protect', v),
  setClickThrough: (v) => ipcRenderer.send('win:clickthrough', v),
  // Recebe atalhos globais e mudanças de estado vindas do processo principal.
  onShortcut: (cb) => ipcRenderer.on('shortcut', (_e, payload) => cb(payload)),
});
