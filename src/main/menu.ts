import { Menu, BrowserWindow, app, shell } from 'electron';
import { logInfo } from '../shared/logger';

export function createApplicationMenu(mainWindow: BrowserWindow) {
  const isMac = process.platform === 'darwin';

  const template: Electron.MenuItemConstructorOptions[] = [
    // App Menu (macOS only)
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const },
            ],
          },
        ]
      : []),

    // File Menu
    {
      label: 'File',
      submenu: [
        {
          label: 'New Snippet',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            logInfo('Menu: New Snippet');
            mainWindow.webContents.send('menu-new-snippet');
          },
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            logInfo('Menu: Save');
            mainWindow.webContents.send('menu-save');
          },
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            logInfo('Menu: Save As');
            mainWindow.webContents.send('menu-save-as');
          },
        },
        { type: 'separator' },
        {
          label: 'Import from File...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            logInfo('Menu: Import');
            mainWindow.webContents.send('menu-import');
          },
        },
        {
          label: 'Export to File...',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            logInfo('Menu: Export');
            mainWindow.webContents.send('menu-export');
          },
        },
        {
          label: 'Export All...',
          click: () => {
            logInfo('Menu: Export All');
            mainWindow.webContents.send('menu-export-all');
          },
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },

    // Edit Menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: () => {
            logInfo('Menu: Find');
            mainWindow.webContents.send('menu-find');
          },
        },
        {
          label: 'Replace',
          accelerator: 'CmdOrCtrl+H',
          click: () => {
            logInfo('Menu: Replace');
            mainWindow.webContents.send('menu-replace');
          },
        },
        { type: 'separator' },
        {
          label: 'Settings...',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            logInfo('Menu: Settings');
            mainWindow.webContents.send('menu-settings');
          },
        },
      ],
    },

    // View Menu
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Sidebar',
          accelerator: 'CmdOrCtrl+B',
          click: () => {
            logInfo('Menu: Toggle Sidebar');
            mainWindow.webContents.send('menu-toggle-sidebar');
          },
        },
        {
          label: 'Toggle Output Panel',
          accelerator: 'CmdOrCtrl+J',
          click: () => {
            logInfo('Menu: Toggle Output Panel');
            mainWindow.webContents.send('menu-toggle-output');
          },
        },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { type: 'separator' },
        { role: 'toggleDevTools' },
        { role: 'reload' },
      ],
    },

    // Run Menu
    {
      label: 'Run',
      submenu: [
        {
          label: 'Run Code',
          accelerator: 'F5',
          click: () => {
            logInfo('Menu: Run Code');
            mainWindow.webContents.send('menu-run');
          },
        },
        {
          label: 'Stop Execution',
          accelerator: 'Shift+F5',
          enabled: false, // Will be enabled when execution cancellation is implemented
          click: () => {
            logInfo('Menu: Stop Execution');
            mainWindow.webContents.send('menu-stop');
          },
        },
        { type: 'separator' },
        {
          label: 'Clear Output',
          accelerator: 'CmdOrCtrl+K',
          click: () => {
            logInfo('Menu: Clear Output');
            mainWindow.webContents.send('menu-clear-output');
          },
        },
      ],
    },

    // Help Menu
    {
      label: 'Help',
      submenu: [
        {
          label: 'About CodePad',
          click: () => {
            logInfo('Menu: About');
            mainWindow.webContents.send('menu-about');
          },
        },
        { type: 'separator' },
        {
          label: 'View Documentation',
          click: () => {
            logInfo('Menu: Documentation');
            shell.openExternal('https://github.com/treytomes/code-pad#readme');
          },
        },
        {
          label: 'Report Issue',
          click: () => {
            logInfo('Menu: Report Issue');
            shell.openExternal('https://github.com/treytomes/code-pad/issues');
          },
        },
        { type: 'separator' },
        {
          label: 'View Logs',
          click: () => {
            logInfo('Menu: View Logs');
            mainWindow.webContents.send('menu-view-logs');
          },
        },
        {
          label: 'Check for Updates',
          enabled: false, // Will be enabled when auto-update is implemented
          click: () => {
            logInfo('Menu: Check for Updates');
            mainWindow.webContents.send('menu-check-updates');
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  logInfo('Application menu created');
}
