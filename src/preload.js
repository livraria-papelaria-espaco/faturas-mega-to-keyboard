const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  readISBNListFromSpreadsheet: (data) =>
    ipcRenderer.invoke("parseSpreadsheet", data),
  cancelPaste: () => ipcRenderer.send("cancelPaste"),
  startPaste: (args, prices) => ipcRenderer.invoke("startPaste", args, prices),
  getBookFromWook: (isbn) => ipcRenderer.invoke("getBookFromWook", isbn),
  getAppVersion: () => ipcRenderer.invoke("getAppVersion"),
});
