import type { Course } from "@/content/types";

export const cssCourse: Course = {
  slug: "css-fundamentals",
  title: "CSS Fundamentals",
  tagline: "Atur tampilan dengan sistem, bukan tebakan.",
  description:
    "Pelajari cascade, box model, tipografi, Flexbox, Grid, dan desain responsif. Fokus pada alasan di balik setiap properti sehingga kamu bisa memperbaiki tata letak sendiri, bukan sekadar menyalin kode.",
  level: "pemula",
  durationMinutes: 140,
  passingScore: 80,
  position: 2,
  objectives: [
    "Menjelaskan cara kerja cascade, inheritance, dan specificity.",
    "Menghitung ukuran elemen dengan box model dan mengatur ruang secara konsisten.",
    "Membangun tata letak satu dimensi dengan Flexbox dan dua dimensi dengan Grid.",
    "Membuat antarmuka responsif, aksesibel, dan mendukung preferensi tema pengguna.",
  ],
  lessons: [
    {
      slug: "css-selektor-cascade",
      title: "Selektor, cascade, dan specificity",
      summary:
        "Bagaimana CSS memilih elemen, mengapa satu aturan menang atas aturan lain, dan cara menulis selektor yang tahan lama.",
      estimatedMinutes: 30,
      content: `CSS bekerja dengan dua langkah: **memilih** elemen, lalu **menerapkan** deklarasi. Ketika beberapa deklarasi menargetkan properti yang sama, browser menyelesaikannya lewat *cascade*. Memahami cascade membuat kamu berhenti menebak-nebak mengapa sebuah gaya "tidak mau berubah".

## Anatomi aturan CSS

~~~css
/* selector { property: value; } */
.card-title {
  color: #1e4c3d;
  font-size: 1.25rem;
}
~~~

- **Selector** menentukan elemen mana yang terkena aturan.
- **Property** adalah aspek yang diatur, misalnya \`color\`.
- **Value** adalah nilainya.

## Jenis selektor yang paling sering dipakai

| Selektor | Contoh | Memilih |
| --- | --- | --- |
| Tipe | \`p\` | Semua elemen \`<p>\` |
| Kelas | \`.intro\` | Elemen dengan \`class="intro"\` |
| ID | \`#kontak\` | Elemen dengan \`id="kontak"\` |
| Atribut | \`[type="email"]\` | Elemen dengan atribut tersebut |
| Keturunan | \`.card p\` | Semua \`p\` di dalam \`.card\` |
| Anak langsung | \`.card > p\` | \`p\` yang merupakan anak langsung \`.card\` |
| Pseudo-class | \`a:hover\` | Tautan saat kursor berada di atasnya |
| Pseudo-element | \`.card::before\` | Bagian semu sebelum isi elemen |

Untuk sebagian besar pekerjaan, **kelas** adalah pilihan terbaik. Kelas bisa dipakai berulang, tidak terlalu kuat specificity-nya, dan mudah dibaca.

## Cascade: urutan sumber

Bayangkan ada dua aturan yang sama-sama cocok dengan sebuah elemen:

~~~css
p {
  color: gray;
}

.intro {
  color: #1e4c3d;
}
~~~

Paragraf dengan \`class="intro"\` akan berwarna hijau. Urutan keputusan cascade secara ringkas:

1. **Origin dan importance** — gaya dari browser, penulis, dan \`!important\` diurutkan dengan aturan khusus.
2. **Specificity** — selektor yang lebih spesifik menang.
3. **Urutan kemunculan** — jika semua sama, aturan yang ditulis belakangan menang.

Gunakan \`!important\` hanya ketika benar-benar perlu menimpa gaya pihak ketiga. Jika kamu sering membutuhkannya, biasanya ada masalah struktur CSS.

## Specificity dalam angka

Specificity dihitung dari tiga komponen:

- **ID** — bobot paling tinggi.
- **Kelas, atribut, pseudo-class** — bobot menengah.
- **Elemen dan pseudo-element** — bobot rendah.

Contoh:

- \`#kontak .card a\` → 1 ID + 1 kelas + 1 elemen.
- \`.card a\` → 1 kelas + 1 elemen.

Aturan pertama menang meskipun ditulis lebih dulu, karena memiliki ID. Sebaliknya, **inline style** (\`style="..."\`) mengalahkan selektor mana pun di stylesheet biasa.

Cara menjaga specificity tetap sehat:

- Utamakan kelas, hindari ID untuk styling.
- Hindari selektor bertingkat terlalu dalam seperti \`.page .layout .card .card-body p\`.
- Lebih baik memberi kelas pada elemen yang ingin diatur.

## Inheritance

Beberapa properti diwariskan otomatis dari elemen induk ke anak, terutama yang berkaitan dengan teks: \`color\`, \`font-family\`, \`font-size\`, dan \`line-height\`. Properti tata letak seperti \`margin\`, \`border\`, dan \`display\` tidak diwariskan.

~~~css
body {
  font-family: system-ui, sans-serif;
  color: #26251f;
}

/* Semua elemen di dalam body mewarisi font dan warna di atas,
   kecuali jika ada aturan yang menimpanya. */
~~~

Properti \`inherit\`, \`initial\`, \`unset\`, dan \`revert\` memungkinkan kontrol eksplisit. Misalnya, tombol pada beberapa browser memakai font sistem sendiri; \`button { font: inherit; }\` menyamakannya dengan teks di sekitarnya.

## Saturasi dan keterbacaan

Menulis warna langsung (\`#1e4c3d\`) bisa merepotkan ketika tema berubah. Custom property memusatkan nilai di satu tempat:

~~~css
:root {
  --ink: #26251f;
  --paper: #faf9f5;
  --accent: #1e4c3d;
}

body {
  background: var(--paper);
  color: var(--ink);
}

a {
  color: var(--accent);
}
~~~

Kita akan memakai pola ini untuk dark mode pada lesson terakhir.

## Memeriksa gaya yang menang

Buka **DevTools → Elements → Styles**. Panel ini menampilkan aturan yang diterapkan, urutannya, dan aturan yang dicoret karena kalah cascade. Kalau sebuah properti tidak berubah, tanyakan:

1. Apakah selektornya benar-benar cocok?
2. Apakah ada aturan lain dengan specificity lebih tinggi?
3. Apakah properti tersebut diwariskan atau dihitung ulang (misalnya \`width\` pada elemen inline)?
4. Apakah ada typo pada nama properti?

Di latihan berikutnya kamu akan memperbaiki aturan yang konflik dan menata ulang selektor agar mudah diprediksi.`,
      code: {
        language: "css",
        filename: "cascade.css",
        caption: "Cascade, specificity, dan custom property",
        code: `:root {
  --ink: #26251f;
  --muted: #6a675e;
  --paper: #faf9f5;
  --accent: #1e4c3d;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 2rem 1rem;
  background: var(--paper);
  color: var(--ink);
  font-family: system-ui, sans-serif;
  line-height: 1.6;
}

a {
  color: var(--accent);
}

a:hover,
a:focus-visible {
  text-decoration-thickness: 2px;
}

.note {
  color: var(--muted);
}

/* Kelas ini menang atas selektor tipe di atasnya. */
.note.important {
  color: var(--accent);
  font-weight: 600;
}`,
      },
      exercise: {
        title: "Selesaikan konflik cascade",
        brief:
          "Dua aturan berebut elemen yang sama. Ubah hanya selektornya agar judul memakai warna aksen dan catatan tetap redup.",
        steps: [
          "Amati hasil di preview: judul dan catatan saat ini berwarna kelabu.",
          "Buat aturan yang menargetkan .judul dengan warna #1e4c3d.",
          "Pastikan .catatan tetap memakai warna #6a675e.",
          "Jangan gunakan !important atau inline style.",
        ],
        hint: "Cascade memilih selektor yang lebih spesifik. Kelas .judul memiliki bobot lebih tinggi daripada selektor tipe h1.",
        starter: {
          html: `<body>
  <h1 class="judul">Cascade itu bisa diprediksi</h1>
  <p class="catatan">Catatan ini harus tetap berwarna redup.</p>
  <p class="catatan penting">Catatan ini ditekankan tanpa mengubah warna catatan lain.</p>
</body>`,
          css: `body {
  font-family: system-ui, sans-serif;
  padding: 2rem;
  background: #faf9f5;
  color: #26251f;
  line-height: 1.6;
}

h1,
p {
  color: #6a675e;
}

/* TODO: beri .judul warna #1e4c3d tanpa !important */

/* TODO: buat .catatan.penting lebih tebal, warna tetap #6a675e */
`,
          js: "",
        },
      },
    },
    {
      slug: "css-box-model-tipografi",
      title: "Box model, tipografi, dan spacing",
      summary:
        "Setiap elemen adalah kotak. Pahami padding, border, margin, ukuran, dan ritme vertikal yang konsisten.",
      estimatedMinutes: 35,
      content: `Setiap elemen HTML dirender sebagai kotak. Ketika tata letak terasa "tidak pas", penyebabnya hampir selalu box model: ukuran, padding, border, atau margin yang tidak diperhitungkan.

## Empat lapis kotak

Dari dalam ke luar:

1. **Content** — teks atau gambar.
2. **Padding** — ruang di dalam border.
3. **Border** — garis tepi.
4. **Margin** — ruang di luar border, memisahkan elemen dari tetangganya.

~~~css
.card {
  width: 320px;
  padding: 1.25rem;
  border: 1px solid #e3dfd4;
  margin-bottom: 1rem;
}
~~~

## content-box vs border-box

Secara default, \`width\` hanya menghitung area konten. Jika kamu menambahkan padding dan border, lebar total bertambah:

- \`width: 320px\` + padding 20px kiri-kanan + border 1px kiri-kanan = **362px**.

Itu sering mengejutkan. Solusi standar adalah mengubah cara perhitungan:

~~~css
*,
*::before,
*::after {
  box-sizing: border-box;
}
~~~

Dengan \`border-box\`, \`width: 320px\` berarti lebar total termasuk padding dan border. Hampir semua proyek modern memakai aturan ini.

## Ukuran yang fleksibel

- \`max-width\` lebih aman daripada \`width\` tetap untuk konten teks.
- \`min-height\` berguna untuk area yang harus tetap terlihat meskipun isinya sedikit.
- Hindari tinggi tetap untuk blok teks karena isi bisa bertambah, terutama dalam bahasa lain atau saat ukuran font diperbesar.

~~~css
.prose {
  width: 100%;
  max-width: 68ch;
  margin-inline: auto;
}
~~~

Satuan \`ch\` mengacu pada lebar karakter "0". Lebar 60–75ch umumnya nyaman dibaca.

## Unit: kapan memakai apa

| Unit | Cocok untuk |
| --- | --- |
| \`px\` | Border, garis tipis, ukuran yang harus presisi |
| \`rem\` | Font size, spacing global; mengikuti preferensi ukuran font pengguna |
| \`em\` | Padding yang menyesuaikan ukuran font komponen |
| \`%\` | Lebar relatif terhadap induk |
| \`ch\` | Lebar baris teks |
| \`dvh\`/\`svh\` | Tinggi viewport pada perangkat mobile |

Aturan praktis: gunakan \`rem\` untuk hampir semua spacing dan ukuran font. \`px\` tetap wajar untuk border 1px.

## Ritme tipografi

Tampilan yang rapi lahir dari skala yang konsisten, bukan angka acak. Tentukan skala lebih dulu:

~~~css
:root {
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.5rem;
  --text-2xl: 2rem;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
}
~~~

Lalu gunakan nilai tersebut di seluruh halaman. Ketika semua jarak berasal dari skala yang sama, halaman terasa memiliki irama.

## line-height dan keterbacaan

- Teks paragraf: \`line-height\` sekitar \`1.6\` sampai \`1.75\`.
- Judul besar: \`1.05\` sampai \`1.2\` agar baris terasa padat dan tegas.
- Gunakan \`text-wrap: balance\` pada judul pendek untuk menghindari satu kata menggantung.

~~~css
h1 {
  font-size: clamp(2rem, 5vw, 3rem);
  line-height: 1.05;
  letter-spacing: -0.02em;
  text-wrap: balance;
}

p {
  line-height: 1.7;
  max-width: 65ch;
}
~~~

## Margin collapse

Margin vertikal antara dua elemen blok dapat **runtuh** menjadi satu margin, yaitu nilai yang lebih besar. Ini bukan bug, tetapi sering membingungkan:

~~~css
.paragraf-a {
  margin-bottom: 24px;
}

.paragraf-b {
  margin-top: 16px;
}

/* Jarak di antara keduanya adalah 24px, bukan 40px. */
~~~

Margin tidak runtuh pada elemen flex atau grid. Jika jarak terasa tidak sesuai, gunakan \`gap\` pada container daripada margin pada anak.

## Tidak semua elemen menghormati width

Elemen inline seperti \`<a>\` dan \`<span>\` mengabaikan \`width\` dan \`height\`. Untuk memberi ukuran, ubah \`display\`-nya:

~~~css
.tombol {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
}
~~~

## Latihan: menghitung kotak

Sebuah kartu memakai \`box-sizing: border-box\`, \`width: 320px\`, \`padding: 24px\`, dan \`border: 1px solid\`. Berapa lebar area kontennya?

Dengan \`border-box\`, lebar total tetap 320px. Area konten = 320 − (24 × 2) − (1 × 2) = **270px**. Latihan berikutnya akan membuat kamu mempraktikkan perhitungan ini lewat CSS nyata.`,
      code: {
        language: "css",
        filename: "kartu.css",
        caption: "Kartu dengan box-sizing, skala spacing, dan tipografi",
        code: `:root {
  --paper: #faf9f5;
  --surface: #ffffff;
  --ink: #26251f;
  --muted: #6a675e;
  --line: #e3dfd4;
  --space-2: 0.5rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: var(--space-6);
  background: var(--paper);
  color: var(--ink);
  font-family: system-ui, sans-serif;
  line-height: 1.65;
}

.card {
  width: 100%;
  max-width: 22rem;
  padding: var(--space-6);
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
}

.card h2 {
  margin: 0 0 var(--space-2);
  font-size: 1.375rem;
  line-height: 1.2;
}

.card p {
  margin: 0;
  color: var(--muted);
  font-size: 0.9375rem;
}`,
      },
      exercise: {
        title: "Perbaiki kartu yang melebar",
        brief:
          "Kartu di editor keluar dari batas container karena box model. Perbaiki tanpa mengubah nilai width yang sudah ada.",
        steps: [
          "Tambahkan box-sizing: border-box pada semua elemen termasuk pseudo-element.",
          "Beri body max-width 24rem dan margin-inline auto agar kartu terpusat.",
          "Atur padding kartu 1.5rem dan margin judul bawah 0.5rem.",
          "Pastikan teks paragraf memakai warna #6a675e.",
        ],
        hint: "Lebar 100% + padding 24px akan melebihi container jika box-sizing masih content-box.",
        starter: {
          html: `<body>
  <div class="kartu">
    <h2>Belajar CSS</h2>
    <p>
      Kotak ini harus muat di dalam container tanpa scroll horizontal.
      Perbaiki box model-nya, bukan dengan mengurangi padding menjadi nol.
    </p>
  </div>
</body>`,
          css: `body {
  margin: 0;
  padding: 2rem;
  font-family: system-ui, sans-serif;
  background: #faf9f5;
  color: #26251f;
}

.kartu {
  width: 100%;
  padding: 1.5rem;
  border: 1px solid #e3dfd4;
  background: #ffffff;
}

/* TODO: terapkan border-box pada semua elemen */

/* TODO: batasi lebar body dan pusatkan */

/* TODO: rapikan judul dan paragraf */
`,
          js: "",
        },
      },
    },
    {
      slug: "css-flexbox-grid",
      title: "Flexbox dan Grid untuk tata letak",
      summary:
        "Satu dimensi dengan Flexbox, dua dimensi dengan Grid. Kapan memakai keduanya dan bagaimana menggabungkannya.",
      estimatedMinutes: 38,
      content: `Ada dua alat utama untuk menata letak modern: **Flexbox** untuk distribusi ruang dalam satu sumbu, dan **Grid** untuk menyusun baris dan kolom sekaligus.

## Flexbox: satu sumbu

Ketika sebuah container diberi \`display: flex\`, anak-anaknya menjadi *flex items* dan disusun sepanjang **main axis** (default horizontal).

~~~css
.baris {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
}
~~~

Properti penting:

- \`flex-direction\` — \`row\` (default) atau \`column\`.
- \`justify-content\` — distribusi sepanjang main axis.
- \`align-items\` — perataan pada cross axis.
- \`gap\` — jarak antar-item; jauh lebih rapi daripada margin.
- \`flex-wrap\` — izinkan item turun baris jika sempit.

Pada item, \`flex: 1\` artinya item boleh tumbuh dan menyusut dengan proporsi yang sama. \`flex: 0 0 auto\` mempertahankan ukuran alami.

~~~css
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.toolbar .search {
  flex: 1 1 14rem;
}

.toolbar .aksi {
  flex: 0 0 auto;
}
~~~

Kapan Flexbox? Navigasi horizontal, toolbar, baris kartu dengan jumlah sedikit, tombol dengan ikon dan teks, atau kolom vertikal yang memenuhi tinggi layar.

## Grid: dua sumbu

Grid mendefinisikan kolom dan baris secara eksplisit:

~~~css
.grid-kartu {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.25rem;
}
~~~

\`minmax(0, 1fr)\` mencegah kolom melebar karena konten panjang. \`repeat(3, ...)\` membuat tiga kolom sama lebar.

Pola responsif tanpa media query:

~~~css
.grid-kartu {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(16rem, 100%), 1fr));
  gap: 1.25rem;
}
~~~

Dengan \`auto-fit\` dan \`minmax\`, browser menentukan berapa kolom yang muat. Ketika layar sempit, grid otomatis menjadi satu kolom.

Untuk tata letak halaman yang lebih kompleks, gunakan area bernama:

~~~css
.layout {
  display: grid;
  grid-template-columns: 15rem minmax(0, 1fr);
  grid-template-areas: "sidebar main";
  gap: 2rem;
}

.layout > .sidebar { grid-area: sidebar; }
.layout > .main { grid-area: main; }
~~~

## Memilih alat

| Kebutuhan | Alat |
| --- | --- |
| Baris tombol dengan ikon | Flexbox |
| Navigasi atas dengan logo dan menu | Flexbox |
| Galeri kartu dengan jumlah kolom otomatis | Grid |
| Halaman dengan sidebar dan konten utama | Grid |
| Kartu dengan isi vertikal dan footer menempel di bawah | Flexbox (column) |

Keduanya bisa digabung: container halaman memakai Grid, di dalam setiap kartu memakai Flexbox.

## Kesalahan umum

1. **Memakai Flexbox untuk grid dua dimensi.** Jika kamu mulai memikirkan baris dan kolom sekaligus, gunakan Grid.
2. **Lupa \`min-width: 0\` pada anak flex yang berisi teks panjang.** Tanpa itu, teks tidak menyusut dan container meluber. Pada Grid gunakan \`minmax(0, 1fr)\`.
3. **Menghitung lebar dengan margin.** Gunakan \`gap\` agar jarak konsisten dan tidak ada margin ganda di tepi.
4. **Menetapkan tinggi tetap pada kartu.** Biarkan konten menentukan tinggi; gunakan \`align-items: stretch\` (default) agar kartu satu baris sama tinggi.
5. **Membuat struktur HTML rumit untuk mencapai tata letak.** Sering kali CSS yang perlu diubah, bukan markup-nya.

## Alignment cepat

Pada Flexbox:

- Pusatkan isi secara horizontal dan vertikal: \`justify-content: center; align-items: center;\`.
- Dorong satu item ke kanan: beri \`margin-left: auto\` pada item tersebut.

Pada Grid:

- Pusatkan seluruh grid: \`place-content: center\`.
- Pusatkan item di dalam sel: \`place-items: center\`.

Latihan berikut meminta kamu membangun galeri kartu yang tetap rapi pada layar sempit dan lebar, dengan satu kartu yang lebih tinggi dari yang lain.`,
      code: {
        language: "css",
        filename: "layout.css",
        caption: "Grid kartu responsif dan toolbar Flexbox",
        code: `body {
  margin: 0;
  padding: 2rem;
  font-family: system-ui, sans-serif;
  background: #faf9f5;
  color: #26251f;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.toolbar h1 {
  margin: 0;
  font-size: 1.5rem;
}

.toolbar .aksi {
  margin-left: auto;
  padding: 0.5rem 0.875rem;
  border: 1px solid #cbc5b6;
  border-radius: 6px;
  background: #ffffff;
  font: inherit;
  font-size: 0.875rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(16rem, 100%), 1fr));
  gap: 1rem;
}

.kartu {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.25rem;
  border: 1px solid #e3dfd4;
  border-radius: 8px;
  background: #ffffff;
}

.kartu p {
  margin: 0;
  color: #6a675e;
}`,
      },
      exercise: {
        title: "Bangun galeri kartu responsif",
        brief:
          "Gunakan Grid untuk galeri dan Flexbox untuk isi kartu. Galeri harus otomatis menjadi satu kolom pada layar sempit.",
        steps: [
          "Beri .galeri display: grid dengan repeat(auto-fit, minmax(min(15rem, 100%), 1fr)).",
          "Tambahkan gap minimal 1rem.",
          "Buat .kartu menjadi flex column sehingga tombol di bawah selalu sejajar.",
          "Pastikan tidak ada scroll horizontal pada lebar 360px.",
        ],
        hint: "Gunakan minmax(0, 1fr) bila isi kartu panjang. Untuk menyamakan tinggi kartu, biarkan stretch sebagai default.",
        starter: {
          html: `<body>
  <div class="toolbar">
    <h1>Kursus saya</h1>
    <button class="aksi" type="button">Filter</button>
  </div>

  <div class="galeri">
    <article class="kartu">
      <h2>HTML Fundamentals</h2>
      <p>Struktur halaman, teks, gambar, dan formulir.</p>
      <a href="#">Lanjutkan</a>
    </article>
    <article class="kartu">
      <h2>CSS Fundamentals</h2>
      <p>Box model, tipografi, Flexbox, dan Grid.</p>
      <a href="#">Lanjutkan</a>
    </article>
    <article class="kartu">
      <h2>JavaScript Fundamentals</h2>
      <p>Variabel, fungsi, DOM, dan event.</p>
      <a href="#">Lanjutkan</a>
    </article>
  </div>
</body>`,
          css: `body {
  margin: 0;
  padding: 2rem;
  font-family: system-ui, sans-serif;
  background: #faf9f5;
  color: #26251f;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.aksi {
  margin-left: auto;
}

.galeri {
  /* TODO: jadikan grid responsif dengan auto-fit dan minmax */
}

.kartu {
  /* TODO: flex column agar tautan berada di bawah */
  border: 1px solid #e3dfd4;
  border-radius: 8px;
  padding: 1.25rem;
  background: #ffffff;
}

.kartu a {
  margin-top: auto;
  color: #1e4c3d;
}
`,
          js: "",
        },
      },
    },
    {
      slug: "css-responsif-state-tema",
      title: "Desain responsif, state, dan tema",
      summary:
        "Mobile-first, media query yang tepat, state interaksi, dan dark mode berbasis custom property.",
      estimatedMinutes: 37,
      content: `Antarmuka yang baik bekerja pada lebar 360px maupun 1440px, dapat digunakan dengan keyboard, dan menghormati preferensi pengguna termasuk mode gelap dan pengurangan animasi.

## Mobile-first

Mulai dari tata letak satu kolom, lalu tambahkan kompleksitas ketika ruang tersedia:

~~~css
.hero {
  padding-block: 2rem;
}

@media (min-width: 48rem) {
  .hero {
    padding-block: 4rem;
  }
}

@media (min-width: 64rem) {
  .hero {
    padding-block: 5rem;
  }
}
~~~

\`min-width\` berarti "mulai dari lebar ini ke atas". Pendekatan ini menjaga CSS dasar tetap sederhana dan sesuai untuk perangkat yang paling terbatas.

Pilih breakpoint berdasarkan **kapan desain mulai terasa sesak**, bukan berdasarkan nama perangkat tertentu. Media query untuk preferensi pengguna juga penting:

~~~css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  /* tetap berguna sebagai nilai awal sebelum pengguna memilih tema */
}
~~~

## Unit responsif tanpa media query

\`clamp(min, ideal, max)\` berguna untuk tipografi dan spacing yang berskala halus:

~~~css
h1 {
  font-size: clamp(2rem, 5vw, 3.5rem);
}

.section {
  padding-block: clamp(2rem, 6vw, 5rem);
}
~~~

\`min()\` dan \`max()\` juga membantu: \`width: min(100%, 40rem)\` memastikan elemen tidak melebihi lebar layar.

Pastikan konten tidak pernah menyebabkan scroll horizontal:

~~~css
img,
video {
  max-width: 100%;
  height: auto;
}
~~~

## State: hover, focus, active, disabled

State memberi umpan balik, tetapi tidak boleh menjadi satu-satunya cara berinteraksi.

~~~css
.button {
  background: #1e4c3d;
  color: #ffffff;
  transition: background-color 150ms ease;
}

.button:hover {
  background: #163a2e;
}

.button:focus-visible {
  outline: 2px solid #1e4c3d;
  outline-offset: 2px;
}

.button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
~~~

Gunakan \`:focus-visible\` agar outline muncul untuk pengguna keyboard tetapi tidak mengganggu pengguna mouse. **Jangan** menulis \`outline: none\` tanpa pengganti yang terlihat.

Perhatikan: warna teks putih di atas latar hijau tua memiliki kontras yang baik. Selalu periksa kontras, terutama untuk teks kecil.

## Dark mode dengan custom property

Definisikan token warna sekali, lalu tukar nilainya berdasarkan preferensi tema. Di LearnCode, kelas \`.dark\` dipasang pada elemen \`<html>\` oleh pengguna atau preferensi sistem.

~~~css
:root {
  --bg: #faf9f5;
  --surface: #ffffff;
  --ink: #26251f;
  --muted: #6a675e;
  --line: #e3dfd4;
  --accent: #1e4c3d;
}

.dark {
  --bg: #121310;
  --surface: #191a16;
  --ink: #f1eee5;
  --muted: #a5a196;
  --line: #2d2e27;
  --accent: #a9cfb9;
}

body {
  background: var(--bg);
  color: var(--ink);
}

.card {
  background: var(--surface);
  border: 1px solid var(--line);
}

.link {
  color: var(--accent);
}
~~~

Karena semua komponen memakai token yang sama, dark mode hanya perlu mengganti nilai token, bukan menulis ulang setiap aturan. Pastikan **kontras tetap memadai** di kedua tema: jangan sekadar membalik warna terang menjadi gelap.

## Animasi yang berguna

Animasi yang baik menjelaskan perubahan, bukan menghibur:

- Transisi warna 150ms pada tombol dan tautan.
- Indikator progres yang bergerak halus.
- Pesan yang muncul dengan fade singkat.

Hindari animasi yang menggeser tata letak, berulang terus-menerus, atau memicu mual. Selalu sediakan jalan keluar lewat \`prefers-reduced-motion\`.

## Daftar periksa responsif

1. Uji pada 360px, 768px, dan 1280px. Gunakan DevTools device mode.
2. Perbesar ukuran font browser menjadi 200%. Apakah tata letak tetap terbaca?
3. Navigasi seluruh halaman dengan Tab. Apakah fokus selalu terlihat?
4. Aktifkan mode gelap. Apakah teks sekunder tetap terbaca?
5. Aktifkan "reduce motion". Apakah semua animasi berhenti?

Latihan berikut menggabungkan grid responsif, state tombol, dan token tema dalam satu halaman kecil.`,
      code: {
        language: "css",
        filename: "responsif.css",
        caption: "Token tema, mobile-first layout, dan state yang aksesibel",
        code: `:root {
  --bg: #faf9f5;
  --surface: #ffffff;
  --ink: #26251f;
  --muted: #6a675e;
  --line: #e3dfd4;
  --accent: #1e4c3d;
  --accent-ink: #ffffff;
}

.dark {
  --bg: #121310;
  --surface: #191a16;
  --ink: #f1eee5;
  --muted: #a5a196;
  --line: #2d2e27;
  --accent: #2f7158;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: clamp(1.25rem, 5vw, 3rem);
  background: var(--bg);
  color: var(--ink);
  font-family: system-ui, sans-serif;
  line-height: 1.65;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(17rem, 100%), 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.card {
  padding: 1.25rem;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
}

.button {
  display: inline-flex;
  align-items: center;
  min-height: 2.5rem;
  padding: 0.5rem 1rem;
  border: 0;
  border-radius: 6px;
  background: var(--accent);
  color: var(--accent-ink);
  font: inherit;
  font-size: 0.9rem;
  cursor: pointer;
}

.button:hover {
  filter: brightness(1.08);
}

.button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: no-preference) {
  .button {
    transition: filter 150ms ease;
  }
}`,
      },
      exercise: {
        title: "Halaman yang siap untuk semua tema",
        brief:
          "Lengkapi halaman dengan token warna, grid responsif, dan state tombol yang jelas. Uji dengan mengubah kelas dark pada <html>.",
        steps: [
          "Tambahkan custom property --bg, --surface, --ink, --line, dan --accent pada :root.",
          "Buat .grid dengan auto-fit dan minmax agar menjadi satu kolom di layar sempit.",
          "Beri .tombol state hover dan focus-visible yang terlihat.",
          "Tambahkan aturan .dark yang mengganti nilai token, bukan properti komponen satu per satu.",
        ],
        hint: "Uji tema dengan menambahkan class=\"dark\" pada <html> di editor. Pastikan teks tetap memiliki kontras yang cukup.",
        starter: {
          html: `<html class="dark">
  <body>
    <h1>Tema yang konsisten</h1>
    <p>Ubah kelas pada elemen html untuk menguji mode gelap.</p>
    <div class="grid">
      <section class="kartu"><h2>HTML</h2><p>Struktur halaman.</p></section>
      <section class="kartu"><h2>CSS</h2><p>Tampilan dan tata letak.</p></section>
      <section class="kartu"><h2>JavaScript</h2><p>Interaksi dan logika.</p></section>
    </div>
    <button class="tombol" type="button">Mulai latihan</button>
  </body>
</html>`,
          css: `:root {
  /* TODO: definisikan token warna terang */
}

.dark {
  /* TODO: definisikan token warna gelap */
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: clamp(1.25rem, 5vw, 3rem);
  background: var(--bg, #faf9f5);
  color: var(--ink, #26251f);
  font-family: system-ui, sans-serif;
  line-height: 1.65;
}

.grid {
  /* TODO: grid responsif */
  margin-block: 1.5rem;
}

.kartu {
  /* TODO: gunakan token untuk background dan border */
  border: 1px solid var(--line, #e3dfd4);
  border-radius: 8px;
  padding: 1.25rem;
}

.tombol {
  /* TODO: warna aksen, kontras, dan state hover/focus */
}
`,
          js: "",
        },
      },
    },
  ],
  quiz: {
    title: "Quiz CSS Fundamentals",
    description:
      "Enam pertanyaan tentang cascade, box model, Flexbox, Grid, responsivitas, dan aksesibilitas. Nilai minimal 80%.",
    questions: [
      {
        id: "css-q1",
        prompt: "Apa yang dilakukan box-sizing: border-box?",
        options: [
          { id: "a", text: "Menambahkan border ke semua elemen" },
          {
            id: "b",
            text: "Menghitung padding dan border di dalam nilai width yang ditetapkan",
          },
          { id: "c", text: "Menghapus margin default browser" },
          { id: "d", text: "Membuat semua elemen menjadi flex" },
        ],
        correctOptionId: "b",
        explanation:
          "Dengan border-box, width mencakup content, padding, dan border. Ini membuat ukuran elemen lebih mudah diprediksi.",
      },
      {
        id: "css-q2",
        prompt: "Selektor mana yang lebih spesifik?",
        code: "#kontak .card a { }  vs  .card a { }",
        options: [
          { id: "a", text: "#kontak .card a" },
          { id: "b", text: ".card a" },
          { id: "c", text: "Keduanya sama" },
          { id: "d", text: "Tergantung urutan penulisan" },
        ],
        correctOptionId: "a",
        explanation:
          "Selektor pertama memiliki satu ID sehingga specificity-nya lebih tinggi daripada selektor yang hanya memakai kelas dan elemen.",
      },
      {
        id: "css-q3",
        prompt:
          "Properti apa yang tepat untuk memberi jarak antar-item pada container flex tanpa margin tambahan di tepi?",
        options: [
          { id: "a", text: "margin: 0 auto" },
          { id: "b", text: "gap" },
          { id: "c", text: "padding" },
          { id: "d", text: "border-spacing" },
        ],
        correctOptionId: "b",
        explanation:
          "gap memberi jarak antar-item pada Flexbox dan Grid tanpa margin di sisi terluar container.",
      },
      {
        id: "css-q4",
        prompt:
          "Kamu ingin galeri kartu otomatis menyesuaikan jumlah kolom tanpa media query. Pola Grid mana yang paling tepat?",
        options: [
          { id: "a", text: "grid-template-columns: repeat(3, 1fr)" },
          { id: "b", text: "grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr))" },
          { id: "c", text: "grid-auto-flow: row dense" },
          { id: "d", text: "grid-template-rows: 1fr 1fr" },
        ],
        correctOptionId: "b",
        explanation:
          "auto-fit bersama minmax memungkinkan browser menempatkan sebanyak mungkin kolom yang muat, lalu menurunkannya pada layar sempit.",
      },
      {
        id: "css-q5",
        prompt: "Mengapa outline: none sebaiknya tidak dipakai sendirian?",
        options: [
          { id: "a", text: "Karena membuat halaman lebih lambat" },
          {
            id: "b",
            text: "Karena pengguna keyboard kehilangan indikator fokus yang penting",
          },
          { id: "c", text: "Karena outline tidak didukung di semua browser" },
          { id: "d", text: "Karena outline bertentangan dengan dark mode" },
        ],
        correctOptionId: "b",
        explanation:
          "Indikator fokus adalah sarana navigasi bagi pengguna keyboard. Jika ingin menghapusnya, ganti dengan gaya fokus yang tetap jelas, misalnya lewat :focus-visible.",
      },
      {
        id: "css-q6",
        prompt:
          "Strategi yang tepat untuk membuat dark mode dengan token warna adalah...",
        options: [
          { id: "a", text: "Menulis ulang setiap komponen dalam file CSS terpisah" },
          { id: "b", text: "Membalik semua warna dengan filter: invert(1)" },
          {
            id: "c",
            text: "Mengganti nilai custom property pada kelas .dark dan memakai token itu di semua komponen",
          },
          { id: "d", text: "Menambahkan !important pada semua aturan gelap" },
        ],
        correctOptionId: "c",
        explanation:
          "Token warna terpusat memungkinkan dark mode hanya mengganti nilai variabel. Kontras tetap harus diperiksa secara manual di kedua tema.",
      },
    ],
  },
};
