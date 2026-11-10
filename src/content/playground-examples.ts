import type { PlaygroundFiles } from "@/lib/playground";
import { defaultPlaygroundFiles } from "@/lib/playground";

export type PlaygroundExample = {
  id: string;
  label: string;
  description: string;
  files: PlaygroundFiles;
};

export const playgroundExamples: PlaygroundExample[] = [
  {
    id: "starter",
    label: "Halaman pertama",
    description: "HTML, CSS, dan JavaScript dasar dengan tombol penghitung.",
    files: defaultPlaygroundFiles,
  },
  {
    id: "cards",
    label: "Grid kartu responsif",
    description: "Latihan CSS Grid dengan auto-fit dan warna aksen.",
    files: {
      html: `<header class="header">
  <p class="eyebrow">Contoh CSS</p>
  <h1>Belajar dengan proyek kecil</h1>
</header>

<main class="grid">
  <article class="card">
    <h2>HTML</h2>
    <p>Struktur yang jelas membuat CSS lebih mudah diatur.</p>
  </article>
  <article class="card">
    <h2>CSS</h2>
    <p>Gunakan token warna dan skala spacing yang konsisten.</p>
  </article>
  <article class="card">
    <h2>JavaScript</h2>
    <p>Tambahkan perilaku hanya setelah struktur selesai.</p>
  </article>
</main>`,
      css: `:root {
  --bg: #faf9f5;
  --surface: #ffffff;
  --ink: #191814;
  --muted: #6a675e;
  --line: #e3dfd4;
  --accent: #1e4c3d;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  padding: clamp(1.25rem, 4vw, 2.5rem);
  background: var(--bg);
  color: var(--ink);
  font-family: system-ui, sans-serif;
  line-height: 1.6;
}

.eyebrow {
  margin: 0;
  font-family: ui-monospace, monospace;
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
}

h1 {
  margin: 0.4rem 0 0;
  font-size: clamp(1.6rem, 4vw, 2.2rem);
  line-height: 1.1;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(15rem, 100%), 1fr));
  gap: 1rem;
  margin-top: 1.75rem;
}

.card {
  padding: 1.25rem;
  border: 1px solid var(--line);
  border-top: 2px solid var(--accent);
  border-radius: 6px;
  background: var(--surface);
}

.card h2 { margin: 0; font-size: 1.05rem; }
.card p { margin: 0.5rem 0 0; color: var(--muted); font-size: 0.9rem; }`,
      js: `document.querySelectorAll(".card").forEach((card) => {
  card.addEventListener("click", () => {
    card.style.borderTopColor = "#9a6414";
  });
});

console.log("Kartu siap diklik.");`,
    },
  },
  {
    id: "counter",
    label: "Counter & event",
    description: "Latihan JavaScript: state sederhana, event, dan ARIA live.",
    files: {
      html: `<main class="panel">
  <p class="eyebrow">Contoh JavaScript</p>
  <h1>Counter</h1>
  <p id="nilai" class="nilai">0</p>
  <div class="aksi">
    <button id="tambah" type="button">Tambah</button>
    <button id="reset" type="button">Reset</button>
  </div>
  <p id="pengumuman" class="sr" aria-live="polite"></p>
</main>`,
      css: `body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background: #faf9f5;
  color: #191814;
  font-family: system-ui, sans-serif;
}

.panel {
  width: min(100%, 22rem);
  padding: 1.75rem;
  border: 1px solid #e3dfd4;
  border-radius: 8px;
  background: #ffffff;
}

.eyebrow {
  margin: 0;
  font-family: ui-monospace, monospace;
  font-size: 0.68rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #6a675e;
}

h1 { margin: 0.5rem 0 0; font-size: 1.4rem; }

.nilai {
  margin: 0.5rem 0;
  font-size: 3rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.aksi { display: flex; gap: 0.5rem; }

button {
  padding: 0.5rem 0.9rem;
  border: 1px solid #1e4c3d;
  border-radius: 5px;
  background: #1e4c3d;
  color: #fff;
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
}

#reset { background: #ffffff; color: #1e4c3d; }

button:focus-visible { outline: 2px solid #1e4c3d; outline-offset: 2px; }

.sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}`,
      js: `const nilai = document.querySelector("#nilai");
const pengumuman = document.querySelector("#pengumuman");
let jumlah = 0;

function render() {
  nilai.textContent = jumlah;
  pengumuman.textContent = \`Jumlah klik: \${jumlah}\`;
}

document.querySelector("#tambah").addEventListener("click", () => {
  jumlah += 1;
  render();
});

document.querySelector("#reset").addEventListener("click", () => {
  jumlah = 0;
  render();
});`,
    },
  },
];
