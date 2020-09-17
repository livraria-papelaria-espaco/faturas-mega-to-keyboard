const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const robotjs = require("robotjs");

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
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

ipcMain.on("handle-paste-cancel", () => {
  cancelPaste = true;
});

ipcMain.on("handle-paste", (event, data, prices) => {
  setTimeout(async () => {
    robotjs.setKeyboardDelay(1);
    for (const isbn of Object.keys(data)) {
      if (cancelPaste) {
        cancelPaste = false;
        break;
      }
      robotjs.typeStringDelayed(isbn, 6000);
      robotjs.keyTap("tab");
      await sleep(100);
      robotjs.keyTap("tab");
      if (prices[isbn]) robotjs.typeStringDelayed(`${prices[isbn]}`, 6000);
      robotjs.keyTap("tab");
      robotjs.typeStringDelayed(data[isbn], 6000);
      robotjs.keyTap("tab");
      robotjs.keyTap("tab");
      robotjs.keyTap("tab");
      robotjs.keyTap("tab");
      await sleep(250);
    }
    event.sender.send("paste-finished");
  });
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
