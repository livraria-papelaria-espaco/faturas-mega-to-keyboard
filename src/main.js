/* xlsx.js (C) 2013-present SheetJS -- https://sheetjs.com */
const XLSX = require("xlsx");
const { ipcRenderer } = require("electron");
const axios = require("axios");

let content = {};
const prices = {};

const WOOK_REGEX = /<script type="application\/ld\+json">[^]*?({[^]+})[^]*?<\/script>[^]*?<!-- Fim Google/;

const processWb = function (wb) {
  const XPORT = document.getElementById("exportBtn");

  const worksheet = wb.Sheets[wb.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(worksheet);

  const isbns = jsonData
    .filter((v) => v.ISBN)
    .map((v) => v.ISBN.replace(/-/g, ""));
  const occurrences = {};
  for (var i = 0; i < isbns.length; i++)
    occurrences[isbns[i]] = (occurrences[isbns[i]] || 0) + 1;
  content = occurrences;

  XPORT.disabled = false;
};

const readFile = function (files) {
  const f = files[0];
  const reader = new FileReader();
  reader.onload = function (e) {
    let data = e.target.result;
    data = new Uint8Array(data);
    processWb(XLSX.read(data, { type: "array" }));
  };
  reader.readAsArrayBuffer(f);
};

const sleep = async (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const exportXlsx = () => startCountdown(content);

const cancelExport = () => {
  ipcRenderer.send("handle-paste-cancel");
};

ipcRenderer.on("paste-finished", () => {
  cancelExportBtn.style.display = "none";
});

const startCountdown = async (args) => {
  const COUNTDOWN = document.getElementById("countdown");
  for (let i = 10; i > 0; i--) {
    COUNTDOWN.innerText = i;
    await sleep(1000);
  }
  COUNTDOWN.innerText = "";
  ipcRenderer.send("handle-paste", args, prices);
  cancelExportBtn.style.display = "block";
};

const handleMiddleExport = (isbn) => () => {
  const keys = Object.keys(content);
  const index = keys.indexOf(isbn);
  const filteredKeys = keys.slice(index);
  const args = {};
  filteredKeys.forEach((key) => (args[key] = content[key]));
  startCountdown(args);

  document.getElementById("countdown").scrollIntoView();
};

const fetchData = async function () {
  const tableBody = document.getElementById("dataTableBody");
  tableBody.innerHTML = "";

  for (const isbn of Object.keys(content)) {
    const qnt = content[isbn];
    const response = await axios.get(`https://www.wook.pt/pesquisa/${isbn}`);
    const dataString = WOOK_REGEX.exec(response.data)?.[1] || "{}";
    const bookMetadata = JSON.parse(dataString);
    const price = bookMetadata.offers && bookMetadata.offers.price;
    if (price) prices[isbn] = price;
    tableBody.insertAdjacentHTML(
      "beforeend",
      `<tr>
    <td>${
      bookMetadata.name ||
      `<span styles="color: red;">Livro não encontrado</span>`
    }</td>
    <td>${isbn}</td>
    <td>${qnt}</td>
    <td>${price || "--"}&nbsp;€</td>
    <td><button id="start-middle-${isbn}">Começar daqui</button></td>
    </tr>`
    );
    document
      .getElementById(`start-middle-${isbn}`)
      .addEventListener("click", handleMiddleExport(isbn), false);
  }
};

// add event listeners
const readIn = document.getElementById("readIn");
const exportBtn = document.getElementById("exportBtn");
const fetchDataBtn = document.getElementById("fetchDataBtn");
const cancelExportBtn = document.getElementById("cancelExportBtn");

readIn.addEventListener(
  "change",
  (e) => {
    readFile(e.target.files);
  },
  false
);
exportBtn.addEventListener("click", exportXlsx, false);
fetchDataBtn.addEventListener("click", fetchData, false);
cancelExportBtn.addEventListener("click", cancelExport, false);
