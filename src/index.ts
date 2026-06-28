import "./index.html";
import * as a1lib from "alt1/base";
import { readLine } from "alt1/ocr";

const chatfont = require("./fonts/aa_12px_mono.fontmeta.json");

type ItemAction = "SELL" | "DISASSEMBLE" | "KEEP" | "UNKNOWN";

type WikiItemInfo = {
  name: string;
  gePrice?: number;
  highAlch?: number;
};

type ComponentMap = Record<string, string[]>;

const componentNames = [
  "Fortunate",
  "Precious",
  "Classic",
  "Historic",
  "Timeworn",
  "Vintage",
  "Pious",
  "Spiritual",
  "Swift",
  "Healthy",
  "Living",
  "Evasive",
  "Powerful",
  "Enhancing",
  "Protective",
  "Base",
  "Blade",
  "Clear",
  "Connector",
  "Crafted",
  "Crystal",
  "Culinary",
  "Deflecting",
  "Delicate",
  "Dextrous",
  "Direct",
  "Dragonfire",
  "Enhancing",
  "Ethereal",
  "Flexible",
  "Head",
  "Heavy",
  "Imbued",
  "Light",
  "Magic",
  "Metallic",
  "Organic",
  "Padded",
  "Plated",
  "Precise",
  "Sharp",
  "Simple",
  "Smooth",
  "Spiked",
  "Strong",
  "Subtle",
  "Tensile",
  "Variable",
  "Cover"
];

const componentItems: ComponentMap = {};
const wikiItemInfo: Record<string, WikiItemInfo> = {};

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
}

function formatGp(n?: number) {
  if (!n) return "unknown";
  return n.toLocaleString() + " gp";
}

function getComponentMatch(item: string): string | null {
  const n = normalize(item);

  for (const [component, items] of Object.entries(componentItems)) {
    if (items.some(x => normalize(x) === n)) return component;
  }

  return null;
}

function analyzeItem(item: string): ItemAction {
  const component = getComponentMatch(item);
  if (component) return "DISASSEMBLE";

  const n = normalize(item);
  const info = wikiItemInfo[n];

  if (info?.gePrice && info.gePrice > 15000) return "SELL";

  return "KEEP";
}

async function loadComponentFromWiki(component: string) {
  const url =
    "https://runescape.wiki/api.php?action=query&format=json&origin=*&list=categorymembers&cmtitle=" +
    encodeURIComponent(`Category:Items that disassemble into ${component} components`) +
    "&cmlimit=500";

  const res = await fetch(url);
  const data = await res.json();

  componentItems[component] =
    data.query?.categorymembers
      ?.map((x: any) => x.title)
      ?.filter((x: string) => !x.startsWith("Category:")) ?? [];
}

async function loadAllComponentsFromWiki() {
  status.innerHTML = "Loading component data from RS Wiki...";

  for (const component of componentNames) {
    try {
      await loadComponentFromWiki(component);
    } catch {
      componentItems[component] = [];
    }
  }

  const allItems: string[] = [];
  Object.values(componentItems).forEach(items => {
   items.forEach(item => allItems.push(item));
  });;
  await loadItemValuesFromWiki(allItems);

  status.innerHTML =
    "Loaded " +
    allItems.length.toLocaleString() +
    " component items from RS Wiki.";
}

async function loadItemValuesFromWiki(itemNames: string[]) {
  const unique = Array.from(new Set(itemNames)).filter(Boolean);

  for (let i = 0; i < unique.length; i += 50) {
    const chunk = unique.slice(i, i + 50);
    const titles = chunk.map(encodeURIComponent).join("|");

    const url =
      "https://runescape.wiki/api.php?action=query&format=json&origin=*&prop=revisions&rvprop=content&rvslots=main&titles=" +
      titles;

    try {
      const res = await fetch(url);
      const data = await res.json();

      for (const page of Object.values(data.query.pages) as any[]) {
        const title = page.title;
        const text = page.revisions?.[0]?.slots?.main?.["*"] || "";

        const geMatch =
          text.match(/\|\s*exchange\s*=\s*([\d,]+)/i) ||
          text.match(/\|\s*gemw\s*=\s*([\d,]+)/i);

        const alchMatch =
          text.match(/\|\s*highalch\s*=\s*([\d,]+)/i) ||
          text.match(/\|\s*high alch\s*=\s*([\d,]+)/i);

        wikiItemInfo[normalize(title)] = {
          name: title,
          gePrice: geMatch ? Number(geMatch[1].replace(/,/g, "")) : undefined,
          highAlch: alchMatch ? Number(alchMatch[1].replace(/,/g, "")) : undefined
        };
      }
    } catch {
      // skip failed wiki batch
    }
  }
}

document.body.innerHTML = `
<div style="padding:10px;font-family:Arial;background:#111;color:white;min-height:100vh;">
  <h2>RS3 Intel Suite</h2>

  <input id="itemInput" placeholder="Enter item name" style="width:100%;padding:8px;" />

  <br/><br/>
  <input id="qtyInput" placeholder="Quantity" value="1" style="width:100%;padding:8px;" />

  <br/><br/>
  <button id="checkBtn" style="width:100%;padding:8px;">Check Item</button>

  <br/><br/>
  <button id="componentsBtn" style="width:100%;padding:8px;">Show Component Lists</button>

  <br/><br/>
  <button id="autoBtn" style="width:100%;padding:8px;">Start Auto Tooltip Scan</button>

  <div id="status" style="margin-top:10px;color:#aaa;">Loading...</div>
  <div id="results" style="margin-top:15px;"></div>
</div>
`;

const input = document.getElementById("itemInput") as HTMLInputElement;
const qtyInput = document.getElementById("qtyInput") as HTMLInputElement;
const results = document.getElementById("results") as HTMLDivElement;
const status = document.getElementById("status") as HTMLDivElement;

function renderItem(item: string, quantity = 1) {
  const action = analyzeItem(item);
  const component = getComponentMatch(item);
  const info = wikiItemInfo[normalize(item)];

  const geEach = info?.gePrice ?? 0;
  const alchEach = info?.highAlch ?? 0;

  const geTotal = geEach * quantity;
  const alchTotal = alchEach * quantity;

  results.innerHTML = `
    <div style="border:1px solid #333;padding:10px;margin-top:10px;">
      <h3>${item}</h3>

      <div><b>Quantity:</b> ${quantity.toLocaleString()}</div>
      <div><b>Recommendation:</b> ${action}</div>
      ${component ? `<div><b>Component:</b> ${component}</div>` : ""}

      <hr/>

      <div><b>GE each:</b> ${formatGp(geEach)}</div>
      <div><b>GE total:</b> ${formatGp(geTotal)}</div>

      <div><b>High alch each:</b> ${formatGp(alchEach)}</div>
      <div><b>High alch total:</b> ${formatGp(alchTotal)}</div>
    </div>
  `;
}

function extractItemFromTooltip(text: string): string {
  return text
    .replace(/Withdraw-All/i, "")
    .replace(/Withdraw-1/i, "")
    .replace(/Withdraw-5/i, "")
    .replace(/Withdraw-10/i, "")
    .replace(/\+\d+ options/i, "")
    .replace(/\([\d,]+\)/g, "")
    .trim();
}

function extractQuantityFromTooltip(text: string): number {
  const match = text.match(/\(([\d,]+)\)/);
  if (!match) return 1;
  return Number(match[1].replace(/,/g, ""));
}

function scanTooltipText(): string {
  const buf = a1lib.capture(0, 0, alt1.rsWidth, alt1.rsHeight);

  const w = alt1.rsWidth;
  const h = alt1.rsHeight;

  const scanRatios = [
    { x: 0.30, y: 0.16 },
    { x: 0.35, y: 0.18 },
    { x: 0.40, y: 0.20 },
    { x: 0.45, y: 0.22 },
    { x: 0.50, y: 0.24 },
    { x: 0.55, y: 0.26 },
    { x: 0.60, y: 0.28 },
    { x: 0.65, y: 0.30 },
    { x: 0.70, y: 0.32 }
  ];

  for (const p of scanRatios) {
    const x = Math.floor(w * p.x);
    const y = Math.floor(h * p.y);
	
if (!chatfont || !chatfont.chars) {
  throw new Error(
    "Bad font object. type=" +
    typeof chatfont +
    " keys=" +
    Object.keys(chatfont || {}).join(",")
  );
}
    const line = readLine(
      buf,
      chatfont,
      [255, 255, 255],
      x,
      y,
      true,
      false
    );

    if (line && line.text) {
      const text = line.text.trim();
      if (text.toLowerCase().includes("withdraw")) return text;
    }
  }

  return "";
}

document.getElementById("checkBtn")!.onclick = async () => {
  const item = input.value.trim();
  const qty = Number(qtyInput.value.replace(/,/g, "")) || 1;

  if (!item) return;

  if (!wikiItemInfo[normalize(item)]) {
    await loadItemValuesFromWiki([item]);
  }

  renderItem(item, qty);
};

document.getElementById("componentsBtn")!.onclick = () => {
  results.innerHTML = Object.entries(componentItems)
    .filter(([, items]) => items.length > 0)
    .map(([component, items]) => `
      <h3>${component} Components</h3>
      <div><b>${items.length}</b> items loaded</div>
      ${items.slice(0, 100).map(item => `<div>${item} → DISASSEMBLE</div>`).join("")}
      ${items.length > 100 ? `<div>...and ${items.length - 100} more</div>` : ""}
    `)
    .join("");
};

let autoRunning = false;
let autoTimer: number | null = null;

function tickAutoMode() {
    try {
        if (!window.alt1 || !alt1.rsLinked || !alt1.permissionPixel) {
            status.innerHTML = "Alt1 is not linked or pixel permission is missing.";
            return;
        }

        const tooltip = scanTooltipText();

        status.innerHTML =
            "Auto Mode: ON<br>" +
            "Tooltip OCR: " + (tooltip || "nothing found");

        if (tooltip) {
            const item = extractItemFromTooltip(tooltip);
            const qty = extractQuantityFromTooltip(tooltip);

            if (item) {
                renderItem(item, qty);
            }
        }
    }
    catch (e: any) {
        status.innerHTML =
            "<pre>" +
            (e?.stack || e?.message || String(e)) +
            "</pre>";
    }
}

document.getElementById("autoBtn")!.onclick = () => {
  const button = document.getElementById("autoBtn") as HTMLButtonElement;

  autoRunning = !autoRunning;

  if (autoRunning) {
    button.innerText = "Stop Auto Tooltip Scan";
    tickAutoMode();

    autoTimer = window.setInterval(() => {
      tickAutoMode();
    }, 1000);
  } else {
    button.innerText = "Start Auto Tooltip Scan";
    status.innerHTML = "Auto Mode: OFF";

    if (autoTimer !== null) {
      clearInterval(autoTimer);
      autoTimer = null;
    }
  }
};

loadAllComponentsFromWiki();