'use strict';

const electron = require('electron');
const { app, BrowserWindow, globalShortcut, Menu } = electron;

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();

// prevent window being garbage collected
let mainWindow;
let popupWindow;

function onClosed() {
	// dereference the window
	// for multiple windows store them in an array
	mainWindow = null;
}

function createMainWindow() {
	const win = new electron.BrowserWindow({
		backgroundColor: "#000",
		icon: __dirname + "/assets/icons/Icon.png"
	});

	// Set minimum size
	win.setMinimumSize(900, 720);

	win.maximize();
	win.setTitle(require('./package.json').name);
	win.loadURL(`file://${__dirname}/index.html`);
	win.on('closed', onClosed);
	return win;
}

function setMyMenu() {
	const myMenu = [
		{
			label: 'View',
			submenu: [
				{ role: 'togglefullscreen' },
			]
		},
		{
			label: 'Window',
			submenu: [
				{ role: 'minimize' },
				{ type: 'separator' },
				{ role: 'close' }
			]
		},
		{
			label: 'Style',
			submenu: [
				{
					label: 'White',
					click() {
						var focusedWindow = BrowserWindow.getFocusedWindow();
						focusedWindow.webContents.send('change-to-white-style');
						console.log('The theme has been changed to white');
					}
				},
				{
					label: 'Pink',
					click() {
						var focusedWindow = BrowserWindow.getFocusedWindow();
						focusedWindow.webContents.send('change-to-pink-style');
						console.log('The theme has been changed to pink');
					}
				},
				{
					label: 'Blue',
					click() {
						var focusedWindow = BrowserWindow.getFocusedWindow();
						focusedWindow.webContents.send('change-to-blue-style');
						console.log('The theme has been changed to blue');
					}
				},
				{
					label: 'Navy',
					click() {
						var focusedWindow = BrowserWindow.getFocusedWindow();
						focusedWindow.webContents.send('change-to-navy-style');
						console.log('The theme has been changed to navy');
					}
				},
				{
					label: 'Green',
					click() {
						var focusedWindow = BrowserWindow.getFocusedWindow();
						focusedWindow.webContents.send('change-to-green-style');
						console.log('The theme has been changed to green');
					}
				},
				{
					label: 'Default',
					click() {
						var focusedWindow = BrowserWindow.getFocusedWindow();
						focusedWindow.webContents.send('change-to-default-style');
						console.log('The theme has been changed to default');
					}
				}]
		},
		{
			label: 'Help',
			submenu: [
				{
					label: require('./package.json').name + ': ' + require('./package.json').description,
					enabled: false
				},
				{ type: 'separator' },
				{
					label: 'Version ' + require('./package.json').version,
					enabled: false
				},
				{
					label: 'Github Homepage',
					click() { require('electron').shell.openExternal('https://github.com/kblincoe/VisualGit_SE701_2019_3'); }
				},
				{
					label: 'Features',
					click() { require('electron').shell.openExternal('https://github.com/kblincoe/VisualGit_SE701_2019_3#features'); }
				},
				{
					label: 'Report Bugs or Request new Features',
					click() { require('electron').shell.openExternal('https://github.com/kblincoe/VisualGit_SE701_2019_3/issues'); }
				},
				{
					label: 'Offline Support',
					click() { require('electron').shell.openItem(__dirname + '/README.pdf'); }
				},
				{ type: 'separator' },
				{
					label: 'Learn More ... ',
					click() { require('electron').shell.openExternal('https://github.com/kblincoe/VisualGit_SE701_2019_3#help'); }
				}
			]
		},
		{
			label: 'Application',
			submenu: [
				{
					label: "About Application", selector: "orderFrontStandardAboutPanel:",
					click() {
						popupWindow = new BrowserWindow({ width: 300, height: 200 }),
							popupWindow.setMenu(null),
							popupWindow.loadURL(`file://${__dirname}/aboutApp.html`)
					}
				},
				{ type: "separator" },
				{
					label: "Quit", accelerator: "Command+Q", click: function () {
						app.quit();
					}
				}
			]
		},
		{
			label: 'Edit',
			submenu: [
				{ label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:", role: "undo" },
				{ label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:", role: "redo" },
				{ type: "separator" },
				{ label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:", role: "cut" },
				{ label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:", role: "copy" },
				{ label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:", role: "paste" },
				{ label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:", role: "selectall" }
			]
		}];

	return myMenu;
}

function registerF5() {
	// disable the F5 key from reloading the app (caused by electron-debug)
	globalShortcut.register('F5', () => {});
}

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (!mainWindow) {
		mainWindow = createMainWindow();
	}
});

app.on('browser-window-blur', () => {
	registerF5();
});

app.on('ready', () => {
	mainWindow = createMainWindow();
	Menu.setApplicationMenu(Menu.buildFromTemplate(setMyMenu()));
	registerF5();
});
