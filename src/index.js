const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { keyboard, Key } = require("@nut-tree/nut-js");
/* xlsx.js (C) 2013-present SheetJS -- https://sheetjs.com */
const XLSX = require("xlsx");
const axios = require("axios");

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    width: 800,
    height: 600,
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, "index.html"));
};

const sleep = async (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

let cancelPaste = false;

ipcMain.on("cancelPaste", () => {
  cancelPaste = true;
});

ipcMain.handle("startPaste", async (event, data, prices) => {
  cancelPaste = false;
  keyboard.config.autoDelayMs = 1;
  for (const isbn of Object.keys(data)) {
    if (cancelPaste) {
      break;
    }
    await keyboard.type(isbn);
    await keyboard.type(Key.Tab);
    await sleep(1000);
    await keyboard.type(Key.Tab);
    if (prices[isbn]) {
      await keyboard.type(`${prices[isbn]}`);
    }
    await keyboard.type(Key.Tab);
    await keyboard.type(`${data[isbn]}`);
    await keyboard.type(Key.Tab);
    await keyboard.type(Key.Tab);
    await keyboard.type(Key.Tab);
    await keyboard.type(Key.Tab);
    await sleep(500);
  }
});

ipcMain.handle("parseSpreadsheet", (event, data) => {
  const wb = XLSX.read(data, { type: "array" });
  const worksheet = wb.Sheets[wb.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(worksheet);

  const isbns = jsonData
    .filter((v) => v.ISBN)
    .map((v) => v.ISBN.replace(/-/g, ""));

  return isbns;
});

ipcMain.handle("getBookFromWook", async (event, isbn) => {
  try {
    const { data } = await axios.get(`https://book-api.diogotc.com/wook/info-by-isbn/${isbn}`);
    return data;
  } catch (e) {
    return false;
  }
});

ipcMain.handle("getAppVersion", (event) => {
  return app.getVersion();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
