import "./index.html";

document.body.innerHTML = `
<div style="padding:10px;font-family:Arial;background:#111;color:white;min-height:100vh;">
  <h2>RS3 Intel Suite - Stage 1</h2>
  <button id="testBtn" style="width:100%;padding:8px;">Test Alt1 Capture</button>
  <div id="status" style="margin-top:10px;color:#aaa;">Waiting...</div>
</div>
`;

const status = document.getElementById("status") as HTMLDivElement;

document.getElementById("testBtn")!.onclick = () => {
  try {
    if (!window.alt1) {
      status.innerHTML = "Alt1 not detected.";
      return;
    }

    status.innerHTML =
      "Alt1 detected<br>" +
      "rsLinked: " + alt1.rsLinked + "<br>" +
      "permissionPixel: " + alt1.permissionPixel + "<br>" +
      "permissionOverlay: " + alt1.permissionOverlay + "<br>" +
      "rsWidth: " + alt1.rsWidth + "<br>" +
      "rsHeight: " + alt1.rsHeight;

    const raw = alt1.capture(0, 0, alt1.rsWidth, alt1.rsHeight);

    status.innerHTML +=
      "<br><br>Capture OK" +
      "<br>Pixels captured: " + raw.length;
  } catch (e: any) {
    status.innerHTML =
      "ERROR:<br><pre style='white-space:pre-wrap;'>" +
      (e?.stack || e?.message || String(e)) +
      "</pre>";
  }
};