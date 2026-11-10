/**
 * Builds the sandboxed preview document used by the playground and the
 * lesson exercise. No application code is ever evaluated in the parent page:
 * user code only runs inside an iframe with `sandbox="allow-scripts"`.
 */

export type PlaygroundFiles = {
  html: string;
  css: string;
  js: string;
};

export type ConsoleLevel = "log" | "info" | "warn" | "error";

export type ConsoleEntry = {
  level: ConsoleLevel;
  text: string;
  time: number;
};

const CONSOLE_BRIDGE = `
<script>
(function () {
  var send = function (level, args) {
    try {
      var text = Array.prototype.map.call(args, function (value) {
        if (value instanceof Error) return value.stack || value.message;
        if (typeof value === "object" && value !== null) {
          try { return JSON.stringify(value); } catch (error) { return String(value); }
        }
        return String(value);
      }).join(" ");
      parent.postMessage({ source: "learncode-preview", level: level, text: text }, "*");
    } catch (error) {}
  };
  ["log", "info", "warn", "error"].forEach(function (level) {
    var original = console[level];
    console[level] = function () {
      send(level, arguments);
      if (original) original.apply(console, arguments);
    };
  });
  window.addEventListener("error", function (event) {
    send("error", [event.message + (event.lineno ? " (baris " + event.lineno + ")" : "")]);
  });
  window.addEventListener("unhandledrejection", function (event) {
    var reason = event.reason;
    send("error", ["Unhandled promise rejection: " + (reason && reason.message ? reason.message : reason)]);
  });
})();
</script>
`;

function escapeClosingScript(value: string): string {
  return value.replace(/<\/script/gi, "<\\/script");
}

/**
 * The user's HTML is inserted as-is inside the iframe body. Because the iframe
 * has an opaque origin and no `allow-same-origin`, it cannot access the parent
 * application, cookies, or storage. The console bridge is injected first.
 */
export function buildPreviewDocument(files: PlaygroundFiles): string {
  const html = files.html ?? "";
  const css = files.css ?? "";
  const js = files.js ?? "";

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="referrer" content="no-referrer" />
<style>
  :root { color-scheme: light; }
  html, body { margin: 0; }
  body { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
  ${css}
</style>
</head>
<body>
${CONSOLE_BRIDGE}
${html}
<script>
try {
${escapeClosingScript(js)}
} catch (error) {
  console.error(error && error.stack ? error.stack : String(error));
}
</script>
</body>
</html>`;
}

export function isValidConsoleMessage(data: unknown): data is {
  source: "learncode-preview";
  level: ConsoleLevel;
  text: string;
} {
  if (typeof data !== "object" || data === null) return false;
  const record = data as Record<string, unknown>;
  return (
    record.source === "learncode-preview" &&
    (record.level === "log" ||
      record.level === "info" ||
      record.level === "warn" ||
      record.level === "error") &&
    typeof record.text === "string"
  );
}

export const defaultPlaygroundFiles: PlaygroundFiles = {
  html: `<main class="card">
  <p class="eyebrow">Latihan playground</p>
  <h1>Halo, LearnCode!</h1>
  <p>
    Ubah teks di atas, ganti warna aksen di CSS, lalu tekan
    <strong>Run</strong> untuk melihat hasilnya.
  </p>
  <button id="aksi" type="button">Klik saya</button>
  <p id="status" class="status">Tombol belum diklik.</p>
</main>`,
  css: `:root {
  --paper: #faf9f5;
  --surface: #ffffff;
  --ink: #191814;
  --muted: #6a675e;
  --line: #e3dfd4;
  --accent: #1e4c3d;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background: var(--paper);
  color: var(--ink);
  font-family: system-ui, sans-serif;
  line-height: 1.6;
}

.card {
  width: min(100%, 26rem);
  padding: 1.75rem;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
}

.eyebrow {
  margin: 0 0 0.5rem;
  font-family: ui-monospace, monospace;
  font-size: 0.68rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
}

h1 {
  margin: 0;
  font-size: 1.6rem;
  line-height: 1.15;
  letter-spacing: -0.015em;
}

p {
  margin: 0.6rem 0 0;
  color: var(--muted);
  font-size: 0.9rem;
}

button {
  margin-top: 1rem;
  padding: 0.5rem 0.9rem;
  border: 1px solid var(--accent);
  border-radius: 5px;
  background: var(--accent);
  color: #fff;
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
}

button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.status {
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
}`,
  js: `const tombol = document.querySelector("#aksi");
const status = document.querySelector("#status");
let jumlah = 0;

tombol.addEventListener("click", () => {
  jumlah += 1;
  status.textContent = \`Tombol diklik \${jumlah} kali.\`;
  console.log("klik:", jumlah);
});`,
};
