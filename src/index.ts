import "./index.html";
import * as a1lib from "alt1/base";
import * as OCR from "alt1/ocr";
const chatfont = require("./fonts/aa_12px_mono.fontmeta.json");

type ItemAction = "SELL" | "DISASSEMBLE" | "KEEP" | "JUNK";

const fortunateItems = [
  "Rune platebody",
  "Robin Hood hat",
  "Ranger boots",
  "Bandos cloak",
  "Armadyl cloak",
  "Saradomin cloak",
  "Zamorak cloak",
  "Ancient cloak"
];

function analyzeItem(item: string): ItemAction {
  const name = item.toLowerCase();

  if (fortunateItems.some(x => x.toLowerCase() === name)) return "DISASSEMBLE";
  if (name.includes("bandos") || name.includes("armadyl")) return "SELL";
  if (name.includes("iron") || name.includes("bronze")) return "JUNK";

  return "KEEP";
}

document.body.innerHTML = `
<div style="padding:10px;font-family:Arial;background:#111;color:white;min-height:100vh;">
  <h2>RS3 Intel Suite vMOUSE</h2>

  <input id="itemInput" placeholder="Enter item name" style="width:100%;padding:8px;" />

  <br/><br/>

  <button id="checkBtn" style="width:100%;padding:8px;">Check Item</button>

  <br/><br/>

  <button id="fortunateBtn" style="width:100%;padding:8px;">Show Fortunate Component Items</button>

  <br/><br/>

  <button id="autoBtn" style="width:100%;padding:8px;">Start Auto Mode</button>

  <div id="status" style="margin-top:10px;color:#aaa;">Auto mode off.</div>

  <div id="results" style="margin-top:15px;"></div>
</div>
`;

const input = document.getElementById("itemInput") as HTMLInputElement;
const results = document.getElementById("results") as HTMLDivElement;
const status = document.getElementById("status") as HTMLDivElement;

function renderItem(item: string) {
  const action = analyzeItem(item);

  results.innerHTML = `
    <div style="border:1px solid #333;padding:10px;margin-top:10px;">
      <h3>${item}</h3>
      <b>${action}</b>
    </div>
  `;
}

document.getElementById("checkBtn")!.onclick = () => {
  const item = input.value.trim();
  if (!item) return;
  renderItem(item);
};

document.getElementById("fortunateBtn")!.onclick = () => {
  results.innerHTML =
    "<h3>Fortunate Component Items</h3>" +
    fortunateItems.map(x => `<div>${x} → DISASSEMBLE</div>`).join("");
};

let autoRunning = false;
let autoTimer: number | null = null;
let mouseX = 0;
let mouseY = 0;

document.addEventListener("mousemove", (event) => {
  mouseX = event.clientX;
  mouseY = event.clientY;
});

function tickAutoMode() {
  try {
    if (!window.alt1) {
      status.innerHTML = "Alt1 object not detected.";
      return;
    }

    status.innerHTML =
      "Auto Mode: ON" +
      "<br>rsLinked: " + alt1.rsLinked +
      "<br>permissionPixel: " + alt1.permissionPixel +
      "<br>permissionOverlay: " + alt1.permissionOverlay +
      "<br>mouseX: " + mouseX +
      "<br>mouseY: " + mouseY;

    if (alt1.permissionOverlay) {
      alt1.overLayRect(
        a1lib.mixColor(255, 128, 0),
        mouseX - 25,
        mouseY - 25,
        50,
        50,
        500,
        2
      );
    }
  } catch (e) {
    status.innerHTML = "Auto Mode error:<br>" + String(e);
  }
}

document.getElementById("autoBtn")!.onclick = () => {
  const button = document.getElementById("autoBtn") as HTMLButtonElement;

  autoRunning = !autoRunning;

  if (autoRunning) {
    button.innerText = "Stop Auto Mode";
    tickAutoMode();

    autoTimer = window.setInterval(() => {
      tickAutoMode();
    }, 250);
  } else {
    button.innerText = "Start Auto Mode";
    status.innerHTML = "Auto Mode: OFF";

    if (autoTimer !== null) {
      clearInterval(autoTimer);
      autoTimer = null;
    }
  }
};