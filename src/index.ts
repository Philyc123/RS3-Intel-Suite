import "./index.html";
import * as a1lib from "alt1/base";

document.body.innerHTML = `
<div style="padding:10px;font-family:Arial;background:#111;color:white;min-height:100vh;">
  <h2>Bank Scanner - Stage 2</h2>
  <button id="scanBtn" style="width:100%;padding:8px;">Scan Tooltip</button>
  <div id="status" style="margin-top:10px;color:#aaa;">Waiting...</div>
</div>
`;

const status = document.getElementById("status") as HTMLDivElement;

type Rect = { x: number; y: number; w: number; h: number };

function isTooltipBorder(r: number, g: number, b: number): boolean {
  return r >= 80 && r <= 150 && g >= 55 && g <= 120 && b >= 20 && b <= 80;
}

function findTooltipBox(img: ImageData): Rect | null {
  const data = img.data;
  const width = img.width;
  const height = img.height;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let found = false;

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      if (isTooltipBorder(r, g, b)) {
        found = true;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!found) return null;

  const w = maxX - minX;
  const h = maxY - minY;

  if (w < 120 || h < 40) return null;
  if (w > 700 || h > 400) return null;

  return { x: minX, y: minY, w, h };
}

document.getElementById("scanBtn")!.onclick = () => {
  try {
    if (!window.alt1 || !alt1.rsLinked || !alt1.permissionPixel) {
      status.innerHTML = "Alt1 not linked or pixel permission missing.";
      return;
    }

    const img = a1lib.capture(0, 0, alt1.rsWidth, alt1.rsHeight);
    const box = findTooltipBox(img);

    if (!box) {
      status.innerHTML =
        "No tooltip box found.<br><br>" +
        "Hover an item so the tooltip is visible, then click Scan Tooltip.";
      return;
    }

    status.innerHTML =
      "Tooltip box detected:<br>" +
      "x: " + box.x + "<br>" +
      "y: " + box.y + "<br>" +
      "width: " + box.w + "<br>" +
      "height: " + box.h + "<br><br>" +
      "Next step: OCR item name inside this box.";
  } catch (e: any) {
    status.innerHTML =
      "ERROR:<br><pre style='white-space:pre-wrap;'>" +
      (e?.stack || e?.message || String(e)) +
      "</pre>";
  }
};