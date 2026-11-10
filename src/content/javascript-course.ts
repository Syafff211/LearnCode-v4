import type { Course } from "@/content/types";

export const javascriptCourse: Course = {
  slug: "javascript-fundamentals",
  title: "JavaScript Fundamentals",
  tagline: "Ubah halaman statis menjadi antarmuka yang merespons.",
  description:
    "Dari variabel dan tipe data sampai DOM dan event. Setiap konsep diuji lewat latihan yang berjalan di browser, sehingga kamu melihat langsung efek kode yang kamu tulis.",
  level: "pemula",
  durationMinutes: 180,
  passingScore: 80,
  position: 3,
  objectives: [
    "Menggunakan let, const, dan tipe data dasar secara tepat.",
    "Menulis kondisi, perulangan, dan fungsi yang mudah dibaca.",
    "Mengolah array dan object dengan metode seperti map, filter, dan reduce.",
    "Membaca serta memanipulasi DOM dan menangani event secara aman.",
    "Membangun komponen interaktif kecil dari nol.",
  ],
  lessons: [
    {
      slug: "js-variabel-tipe-operator",
      title: "Variabel, tipe data, dan operator",
      summary:
        "Menyimpan nilai dengan let dan const, mengenali tipe data JavaScript, dan menghindari perbandingan yang menipu.",
      estimatedMinutes: 32,
      content: `JavaScript adalah bahasa yang *dinamis*: tipe nilai tidak ditulis pada deklarasi, tetapi ditentukan saat program berjalan. Memahami tipe dan operator adalah dasar untuk membaca dan menulis kode yang dapat diprediksi.

## let dan const

Gunakan \`const\` sebagai pilihan pertama, dan \`let\` ketika nilai perlu diganti.

~~~javascript
const nama = "Rani";
let jumlahLatihan = 0;

jumlahLatihan = jumlahLatihan + 1; // boleh
// nama = "Budi"; // TypeError
~~~

\`const\` mencegah **binding** diganti, bukan mencegah isi object diubah:

~~~javascript
const pengguna = { nama: "Rani", level: "pemula" };
pengguna.level = "menengah"; // boleh
// pengguna = {}; // tidak boleh
~~~

Hindari \`var\` pada kode baru. \`var\` memiliki function scope dan perilaku *hoisting* yang mudah menimbulkan bug.

## Tipe data primitif

| Tipe | Contoh | Catatan |
| --- | --- | --- |
| \`string\` | \`"Halo"\`, \`'Halo'\`, \`\\\`Halo\\\`\` | Teks |
| \`number\` | \`42\`, \`3.14\`, \`NaN\` | Selalu floating point |
| \`boolean\` | \`true\`, \`false\` | Hasil perbandingan |
| \`undefined\` | variabel tanpa nilai | "Belum diisi" |
| \`null\` | \`null\` | Sengaja dikosongkan |
| \`bigint\` | \`10n\` | Bilangan bulat sangat besar |
| \`symbol\` | \`Symbol("id")\` | Identifier unik |

Selain primitif, ada \`object\` — termasuk array dan fungsi. Gunakan \`typeof\` untuk memeriksa, dengan catatan \`typeof null\` menghasilkan \`"object"\`, salah satu quirk lama JavaScript.

~~~javascript
typeof "Rani";      // "string"
typeof 42;          // "number"
typeof true;        // "boolean"
typeof undefined;   // "undefined"
typeof null;        // "object" (quirk)
typeof [];          // "object"
typeof function () {}; // "function"
~~~

## Template literal

Template literal memudahkan penyusunan teks:

~~~javascript
const nama = "Rani";
const jumlah = 3;

const pesan = \`\${nama} menyelesaikan \${jumlah} latihan.\`;
console.log(pesan); // Rani menyelesaikan 3 latihan.
~~~

Gunakan \`\${...}\` hanya untuk ekspresi pendek. Jika logikanya panjang, hitung dulu di variabel terpisah agar kode tetap terbaca.

## Operator yang sering menjebak

### Perbandingan

Selalu gunakan \`===\` dan \`!==\`. Operator \`==\` melakukan konversi tipe otomatis dan dapat menghasilkan kejutan:

~~~javascript
0 == "";        // true
0 == false;     // true
"" == false;    // true
null == undefined; // true

0 === "";       // false
null === undefined; // false
~~~

### Kebenaran (truthiness)

Nilai berikut dianggap \`false\` ketika dipakai dalam kondisi:

- \`false\`
- \`0\` dan \`-0\`
- \`""\` (string kosong)
- \`null\`
- \`undefined\`
- \`NaN\`

Semua object dan array — termasuk \`[]\` dan \`{}\` — dianggap \`true\`. Ini penyebab bug klasik:

~~~javascript
if ([]) {
  console.log("Array kosong tetap dianggap truthy");
}
~~~

Untuk memeriksa array kosong, gunakan \`arr.length === 0\`.

### Operator modern yang berguna

~~~javascript
const nama = pengguna?.profil?.nama ?? "Tanpa nama";
const harga = 120_000;

console.log(harga.toLocaleString("id-ID")); // "120.000"
~~~

- \`?.\` menghentikan akses jika nilai \`null\` atau \`undefined\`.
- \`??\` memberi nilai default hanya untuk \`null\` atau \`undefined\`, berbeda dari \`||\` yang juga menangkap \`0\` dan \`""\`.

## Angka dan pembagian

~~~javascript
const total = 10 / 4;         // 2.5
const hasil = 10 % 3;         // 1 (sisa bagi)

Number.parseInt("42", 10);    // 42
Number("42px");               // NaN
Number.parseFloat("42.5px");  // 42.5
~~~

Selalu periksa \`Number.isNaN()\` ketika hasil konversi bisa gagal. Jangan membandingkan NaN dengan \`===\` karena \`NaN === NaN\` bernilai \`false\`.

## Latihan berpikir

Apa yang akan dicetak kode berikut?

~~~javascript
const nilai = 0;
const label = nilai || "kosong";
const label2 = nilai ?? "kosong";
console.log(label, label2);
~~~

Jawabannya: \`"kosong" 0\`. \`||\` menganggap \`0\` falsy, sedangkan \`??\` hanya menangani \`null\` dan \`undefined\`.

Di latihan berikutnya kamu akan menghitung total belanja dan menyusun teks struk dengan template literal.`,
      code: {
        language: "javascript",
        filename: "variabel.js",
        caption: "Variabel, tipe data, dan template literal",
        code: `const nama = "Rani";
const latihanSelesai = 3;
const targetLatihan = 5;

const persentase = Math.round((latihanSelesai / targetLatihan) * 100);
const pesan = \`\${nama} menyelesaikan \${latihanSelesai} dari \${targetLatihan} latihan (\${persentase}%).\`;

console.log(pesan);

const daftarKursus = ["HTML", "CSS", "JavaScript"];
console.log(daftarKursus.length);       // 3
console.log(typeof daftarKursus);       // "object"
console.log(Array.isArray(daftarKursus)); // true

const pengguna = {
  nama,
  level: "pemula",
  aktif: true,
};

console.log(pengguna?.level ?? "tidak diketahui");`,
      },
      exercise: {
        title: "Hitung total belanja",
        brief:
          "Lengkapi fungsi hitungTotal di editor. Tampilkan hasilnya ke halaman, bukan hanya ke console.",
        steps: [
          "Gunakan const untuk harga dan jumlah.",
          "Hitung subtotal, lalu tambahkan pajak 11% dan bulatkan dengan Math.round.",
          "Susun teks struk memakai template literal.",
          "Tampilkan hasil ke elemen #hasil dengan textContent.",
        ],
        hint: "Pajak dihitung dari subtotal: Math.round(subtotal * 0.11). Jangan lupa menambahkan subtotal dan pajak.",
        starter: {
          html: `<main>
  <h1>Struk Belanja</h1>
  <p id="hasil">Hasil akan muncul di sini.</p>
</main>`,
          css: `body {
  font-family: system-ui, sans-serif;
  padding: 1.5rem;
  line-height: 1.6;
}

main {
  max-width: 30rem;
}

#hasil {
  padding: 1rem;
  border: 1px solid #e3dfd4;
  border-radius: 6px;
  background: #faf9f5;
  white-space: pre-line;
}`,
          js: `const hargaSatuan = 25000;
const jumlah = 3;

// TODO: hitung subtotal
// TODO: hitung pajak 11% dari subtotal, bulatkan
// TODO: hitung total

const hasil = document.querySelector("#hasil");

// TODO: susun teks struk dengan template literal lalu tampilkan
hasil.textContent = "Belum dihitung.";
`,
        },
      },
    },
    {
      slug: "js-kondisi-perulangan",
      title: "Kondisi dan perulangan",
      summary:
        "Mengambil keputusan dengan if, switch, dan guard clause; mengulang pekerjaan dengan for dan for...of.",
      estimatedMinutes: 34,
      content: `Program selalu mengambil keputusan dan mengulang pekerjaan. Menulisnya dengan jelas lebih penting daripada menulisnya sesingkat mungkin.

## if, else if, else

~~~javascript
const skor = 84;

if (skor >= 80) {
  console.log("Lulus dengan predikat baik.");
} else if (skor >= 60) {
  console.log("Lulus dengan catatan.");
} else {
  console.log("Perlu mengulang quiz.");
}
~~~

Urutan kondisi penting. Jika kondisi pertama sudah menangkap semua kasus, kondisi berikutnya tidak akan pernah dievaluasi.

## Guard clause

Alih-alih membuat blok \`if\` bersarang dalam, keluarkan kasus yang tidak valid lebih dulu:

~~~javascript
function prosesPesanan(pesanan) {
  if (!pesanan) return "Pesanan tidak ditemukan";
  if (pesanan.item.length === 0) return "Keranjang kosong";
  if (!pesanan.alamat) return "Alamat wajib diisi";

  // alur utama tetap sejajar dan mudah dibaca
  return "Pesanan siap dikirim";
}
~~~

Pola ini disebut *early return*. Hasilnya lebih mudah dipindai daripada lima tingkat indentasi.

## switch untuk nilai diskret

Gunakan \`switch\` ketika satu ekspresi dibandingkan dengan beberapa nilai tetap:

~~~javascript
function labelLevel(level) {
  switch (level) {
    case "pemula":
      return "Mulai dari dasar";
    case "menengah":
      return "Perkuat pola yang sudah dikenal";
    case "lanjutan":
      return "Fokus pada kasus nyata";
    default:
      return "Level tidak dikenal";
  }
}
~~~

Jangan lupa \`break\` atau \`return\` di setiap cabang. Tanpa itu, eksekusi "jatuh" ke cabang berikutnya.

## Ternary: hanya untuk pilihan sederhana

~~~javascript
const status = skor >= 80 ? "lulus" : "belum lulus";
~~~

Ternary berguna untuk satu keputusan dengan dua hasil. Jika mulai bersarang, kembalikan ke \`if\`.

## Perulangan

### for klasik

Cocok ketika indeks penting atau jumlah iterasi pasti:

~~~javascript
const langkah = ["Tulis struktur", "Tambahkan CSS", "Uji di browser"];

for (let i = 0; i < langkah.length; i++) {
  console.log(\`\${i + 1}. \${langkah[i]}\`);
}
~~~

Berhati-hatilah dengan batas: \`i < langkah.length\` lebih aman daripada \`i <= langkah.length\`, yang akan mengakses indeks di luar array.

### for...of

Lebih mudah dibaca ketika kamu hanya perlu nilai:

~~~javascript
for (const item of langkah) {
  console.log(item);
}
~~~

Gunakan \`for...in\` hanya untuk enumerasi kunci object, dan berhati-hatilah dengan properti warisan. Untuk array, \`for...of\` adalah pilihan yang lebih tepat.

### while dan do...while

Gunakan \`while\` ketika jumlah iterasi tidak diketahui:

~~~javascript
let percobaan = 0;

while (percobaan < 3) {
  percobaan++;
  console.log(\`Percobaan ke-\${percobaan}\`);
}
~~~

Pastikan ada kondisi yang akhirnya berhenti. Loop tanpa akhir membekukan tab browser.

## Pola akumulasi

Sebagian besar perulangan melakukan salah satu dari ini: menghitung, menjumlahkan, atau mencari.

~~~javascript
const nilai = [72, 88, 95, 64];

let total = 0;
for (const n of nilai) {
  total += n;
}

const rataRata = total / nilai.length;
const tertinggi = Math.max(...nilai);
const lulus = nilai.filter((n) => n >= 80).length;

console.log({ rataRata, tertinggi, lulus });
~~~

## Kontrol alur: break dan continue

~~~javascript
for (const n of nilai) {
  if (n < 70) continue;   // lewati yang di bawah 70
  if (n === 95) break;     // berhenti ketika menemukan 95
  console.log(n);
}

const indeks = nilai.indexOf(95);
if (indeks !== -1) {
  console.log(\`Ditemukan pada indeks \${indeks}\`);
}
~~~

Gunakan \`break\` dan \`continue\` secukupnya. Jika terlalu banyak, pertimbangkan memecah fungsi atau memakai metode array yang lebih deklaratif.

## Latihan berikut

Kamu akan menampilkan daftar tugas dengan status berdasarkan nilai: selesai, hampir, atau belum. Ini menguji if/else, perulangan, dan penggabungan teks.`,
      code: {
        language: "javascript",
        filename: "kondisi.js",
        caption: "Guard clause dan perulangan untuk ringkasan nilai",
        code: `const daftarNilai = [72, 88, 95, 64, 100];

function ringkasNilai(nilai) {
  if (!Array.isArray(nilai) || nilai.length === 0) {
    return "Tidak ada nilai untuk diringkas.";
  }

  let total = 0;
  let jumlahLulus = 0;

  for (const n of nilai) {
    total += n;
    if (n >= 80) {
      jumlahLulus++;
    }
  }

  const rataRata = Math.round(total / nilai.length);
  const status = rataRata >= 80 ? "di atas target" : "perlu latihan lagi";

  return \`Rata-rata \${rataRata} (\${status}). \${jumlahLulus} dari \${nilai.length} nilai lulus.\`;
}

console.log(ringkasNilai(daftarNilai));
console.log(ringkasNilai([]));`,
      },
      exercise: {
        title: "Daftar langkah belajar",
        brief:
          "Tampilkan setiap langkah dengan nomor dan status. Gunakan perulangan dan kondisi, bukan menulis HTML satu per satu.",
        steps: [
          "Buat array berisi minimal empat langkah belajar.",
          "Gunakan for...of dengan indeks (entries) atau for klasik untuk menomori langkah.",
          "Tandai langkah pertama sebagai 'selesai' dan langkah terakhir sebagai 'berikutnya'.",
          "Render setiap langkah ke dalam <ol id=\"daftar\"> memakai createElement, bukan innerHTML.",
        ],
        hint: "Gunakan if/else if di dalam loop. Untuk indeks, for...of pada array.entries() memberi pasangan [indeks, nilai].",
        starter: {
          html: `<main>
  <h1>Rencana Belajar</h1>
  <button id="tampilkan" type="button">Tampilkan rencana</button>
  <ol id="daftar" aria-live="polite"></ol>
</main>`,
          css: `body {
  font-family: system-ui, sans-serif;
  padding: 1.5rem;
  color: #26251f;
}

main {
  max-width: 32rem;
}

button {
  padding: 0.5rem 0.875rem;
  border: 1px solid #cbc5b6;
  border-radius: 6px;
  background: #ffffff;
  font: inherit;
  cursor: pointer;
}

li {
  margin-block: 0.5rem;
}

.status {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-left: 0.5rem;
}

.selesai { color: #17663a; }
.berikutnya { color: #9a6414; }`,
          js: `const langkah = [
  "Susun struktur HTML",
  "Tambahkan gaya dengan CSS",
  "Tambahkan interaksi dengan JavaScript",
  "Uji di browser mobile",
];

const daftar = document.querySelector("#daftar");
const tombol = document.querySelector("#tampilkan");

tombol.addEventListener("click", () => {
  daftar.textContent = "";

  // TODO: loop langkah, buat <li> untuk setiap item
  // TODO: tentukan status: selesai (langkah pertama), berikutnya (langkah terakhir), atau belum
  // TODO: tampilkan nomor dan status di dalam li
});
`,
        },
      },
    },
    {
      slug: "js-fungsi-scope-array",
      title: "Fungsi, scope, dan pengolahan array",
      summary:
        "Memecah masalah menjadi fungsi kecil, memahami scope, lalu mengolah array dengan map, filter, dan reduce.",
      estimatedMinutes: 38,
      content: `Fungsi adalah alat utama untuk mengelola kompleksitas. Semakin kecil dan jelas sebuah fungsi, semakin mudah kode diuji dan diubah.

## Deklarasi dan arrow function

~~~javascript
function tambah(a, b) {
  return a + b;
}

const tambahArrow = (a, b) => a + b;
~~~

Keduanya punya perbedaan penting:

- Deklarasi fungsi dapat dipanggil sebelum barisnya ditulis karena *hoisting*.
- Arrow function tidak memiliki \`this\` sendiri dan tidak bisa dipakai sebagai constructor.
- Arrow function cocok untuk callback pendek; deklarasi fungsi lebih terbaca untuk logika utama.

Konsistenlah dalam satu proyek. Di LearnCode, fungsi bernama memakai deklarasi, sedangkan callback pendek memakai arrow.

## Parameter dan nilai kembali

~~~javascript
function buatSapaan(nama, sapaan = "Halo") {
  return \`\${sapaan}, \${nama}!\`;
}

function jumlahkan(...angka) {
  return angka.reduce((total, n) => total + n, 0);
}

console.log(buatSapaan("Rani"));            // Halo, Rani!
console.log(buatSapaan("Budi", "Selamat pagi")); // Selamat pagi, Budi!
console.log(jumlahkan(1, 2, 3));            // 6
~~~

Default parameter berguna ketika nilai tidak diberikan atau bernilai \`undefined\`. Parameter *rest* (\`...\`) mengumpulkan argumen menjadi array.

Jika fungsi tidak mengembalikan apa pun, nilainya \`undefined\`. Jangan mengandalkan efek samping ketika sebuah fungsi seharusnya mengembalikan nilai.

## Satu fungsi, satu tanggung jawab

Fungsi yang mencampur perhitungan, manipulasi DOM, dan logging sulit diuji. Pisahkan:

~~~javascript
// perhitungan: mudah diuji
function hitungDiskon(harga, persen) {
  if (persen < 0 || persen > 100) throw new Error("Persen tidak valid");
  return Math.round(harga * (1 - persen / 100));
}

// tampilan: bergantung pada DOM
function tampilkanHarga(harga) {
  document.querySelector("#harga").textContent = \`Rp\${harga.toLocaleString("id-ID")}\`;
}

const hargaAkhir = hitungDiskon(250_000, 20);
tampilkanHarga(hargaAkhir);
~~~

## Scope

Variabel yang dideklarasikan dengan \`const\` dan \`let\` memiliki *block scope*: ia hanya hidup di dalam blok \`{}\` tempat ia dibuat.

~~~javascript
let total = 0;

for (let i = 0; i < 3; i++) {
  const sementara = i * 2;
  total += sementara;
}

// console.log(sementara); // ReferenceError
// console.log(i);         // ReferenceError
console.log(total);        // 6
~~~

Menjaga variabel sedekat mungkin dengan penggunaannya mengurangi kemungkinan bug dan membuat fungsi lebih mudah dipahami.

## Closure secara ringkas

Fungsi "mengingat" variabel dari lingkungan tempat ia dibuat:

~~~javascript
function buatPenghitung() {
  let jumlah = 0;
  return function () {
    jumlah += 1;
    return jumlah;
  };
}

const penghitung = buatPenghitung();
penghitung(); // 1
penghitung(); // 2
~~~

Setiap pemanggilan \`buatPenghitung\` membuat lingkungan baru, sehingga dua penghitung tidak saling mengganggu. Pola ini berguna untuk menyimpan state lokal tanpa variabel global.

## map, filter, dan reduce

Ketiganya tidak mengubah array asli (kecuali kamu memanggil mutasi di dalam callback).

~~~javascript
const kursus = [
  { judul: "HTML", durasi: 110, selesai: true },
  { judul: "CSS", durasi: 140, selesai: false },
  { judul: "JavaScript", durasi: 180, selesai: true },
];

// map: transformasi setiap item
const judul = kursus.map((k) => k.judul);
// ["HTML", "CSS", "JavaScript"]

// filter: ambil yang lolos kondisi
const belumSelesai = kursus.filter((k) => !k.selesai);
// [{ judul: "CSS", ... }]

// reduce: ringkas menjadi satu nilai
const totalDurasi = kursus.reduce((total, k) => total + k.durasi, 0);
// 430

console.log(judul, belumSelesai.length, totalDurasi);
~~~

Ketika mengembalikan object dari arrow function, bungkus dengan tanda kurung:

~~~javascript
const ringkas = kursus.map((k) => ({ judul: k.judul, menit: k.durasi }));
~~~

Tanpa tanda kurung, \`{}\` dianggap blok kode, bukan object.

## Mencari dan memeriksa

~~~javascript
const css = kursus.find((k) => k.judul === "CSS");   // object atau undefined
const adaJS = kursus.some((k) => k.judul === "JavaScript"); // true
const semuaSelesai = kursus.every((k) => k.selesai);  // false
const indeksCSS = kursus.findIndex((k) => k.judul === "CSS"); // 1
~~~

Gunakan \`find\` ketika butuh itemnya, \`filter\` ketika butuh semua yang cocok, dan \`some\` ketika hanya butuh jawaban ya/tidak.

## Peringatan: sort mengubah array

\`sort()\` dan \`reverse()\` memutasi array asli. Salin dulu jika kamu masih membutuhkan urutan awal:

~~~javascript
const urut = [...kursus].sort((a, b) => a.durasi - b.durasi);
~~~

Untuk membandingkan angka, selalu berikan fungsi pembanding. Tanpa itu, nilai dibandingkan sebagai string dan \`100\` akan dianggap lebih kecil dari \`20\`.

Latihan berikut menggabungkan fungsi murni dan metode array untuk membuat ringkasan progres.`,
      code: {
        language: "javascript",
        filename: "fungsi.js",
        caption: "Fungsi murni, scope, dan metode array",
        code: `const modul = [
  { judul: "HTML", durasi: 110, selesai: true },
  { judul: "CSS", durasi: 140, selesai: false },
  { judul: "JavaScript", durasi: 180, selesai: false },
];

function ringkasKursus(daftar) {
  const selesai = daftar.filter((m) => m.selesai);
  const totalMenit = daftar.reduce((total, m) => total + m.durasi, 0);
  const menitSelesai = selesai.reduce((total, m) => total + m.durasi, 0);
  const persentase = totalMenit === 0 ? 0 : Math.round((menitSelesai / totalMenit) * 100);

  return {
    jumlahSelesai: selesai.length,
    total: daftar.length,
    persentase,
    berikutnya: daftar.find((m) => !m.selesai)?.judul ?? null,
  };
}

console.log(ringkasKursus(modul));
console.log(modul.length); // array asli tidak berubah`,
      },
      exercise: {
        title: "Ringkasan progres kursus",
        brief:
          "Gunakan filter, reduce, dan find untuk membuat ringkasan. Render hasilnya dengan textContent, bukan innerHTML.",
        steps: [
          "Hitung jumlah lesson yang selesai dengan filter.",
          "Hitung persentase berdasarkan durasi, bukan jumlah lesson.",
          "Temukan lesson berikutnya dengan find pada item yang belum selesai.",
          "Tampilkan ringkasan di #ringkasan. Jika semua selesai, tampilkan pesan khusus.",
        ],
        hint: "Gunakan reduce untuk total durasi dan durasi selesai. Jaga fungsi tetap murni: kembalikan object, lalu render terpisah.",
        starter: {
          html: `<main>
  <h1>Progres Kursus</h1>
  <p id="ringkasan">Menghitung...</p>
  <ul id="daftar"></ul>
</main>`,
          css: `body {
  font-family: system-ui, sans-serif;
  padding: 1.5rem;
  line-height: 1.6;
  color: #26251f;
}

main { max-width: 32rem; }

#ringkasan {
  padding: 0.875rem 1rem;
  border-left: 3px solid #1e4c3d;
  background: #f3f1e9;
}

li.selesai { text-decoration: line-through; color: #6a675e; }`,
          js: `const lessons = [
  { judul: "Variabel dan tipe data", menit: 32, selesai: true },
  { judul: "Kondisi dan perulangan", menit: 34, selesai: true },
  { judul: "Fungsi dan array", menit: 38, selesai: false },
  { judul: "DOM dan event", menit: 40, selesai: false },
  { judul: "Proyek daftar tugas", menit: 36, selesai: false },
];

// TODO: buat fungsi ringkas(lessons) yang mengembalikan jumlah selesai, persentase, dan lesson berikutnya
// TODO: render ringkasan ke #ringkasan
// TODO: render setiap lesson ke #daftar, tandai yang selesai dengan class "selesai"
`,
        },
      },
    },
    {
      slug: "js-dom-event",
      title: "DOM dan event",
      summary:
        "Memilih elemen, mengubah konten dengan aman, merespons interaksi, dan menghindari jebakan umum.",
      estimatedMinutes: 40,
      content: `DOM (Document Object Model) adalah representasi halaman yang dapat dibaca dan diubah oleh JavaScript. Ketika kamu menulis \`document.querySelector("#judul")\`, kamu mengambil node dari pohon DOM.

## Memilih elemen

~~~javascript
const judul = document.querySelector("h1");
const semuaTautan = document.querySelectorAll(".nav a");
const tombol = document.getElementById("simpan");
~~~

- \`querySelector\` mengembalikan elemen pertama yang cocok, atau \`null\`.
- \`querySelectorAll\` mengembalikan NodeList statis; ia tidak berubah ketika DOM berubah.
- \`getElementById\` cepat dan jelas untuk id.

Selalu periksa null sebelum memakai elemen:

~~~javascript
const tombol = document.querySelector("#simpan");
if (!tombol) {
  console.warn("Tombol tidak ditemukan di halaman ini.");
} else {
  tombol.addEventListener("click", () => console.log("diklik"));
}
~~~

## Mengubah teks dengan aman

~~~javascript
const pesan = document.querySelector("#pesan");
pesan.textContent = "Tersimpan.";
~~~

\`textContent\` memperlakukan input sebagai teks biasa. \`innerHTML\` mem-parsing string sebagai HTML; jika isinya berasal dari pengguna, ini membuka celah **XSS** (cross-site scripting). Karena itu, gunakan \`textContent\` untuk data pengguna.

Jika memang perlu menyisipkan HTML dari sumber tepercaya, pastikan sudah disanitasi. Aturan praktis: **jangan pernah** memasukkan input pengguna ke \`innerHTML\`.

## Membuat elemen

~~~javascript
const daftar = document.querySelector("#daftar");
const item = document.createElement("li");
item.textContent = "Belajar event listener";
daftar.append(item);
~~~

\`append\` menerima node maupun string dan bisa menambahkan beberapa sekaligus. \`prepend\` menambahkan di awal.

## Class, atribut, dan state

~~~javascript
const kartu = document.querySelector(".kartu");

kartu.classList.add("aktif");
kartu.classList.remove("redup");
kartu.classList.toggle("terpilih");
kartu.classList.contains("aktif"); // true

kartu.setAttribute("aria-expanded", "true");
kartu.hidden = true;
~~~

Gunakan \`classList\` daripada memanipulasi \`className\` secara manual. Untuk state yang penting bagi aksesibilitas, perbarui atribut ARIA yang sesuai — misalnya \`aria-expanded\` pada tombol yang membuka panel.

## Event listener

~~~javascript
const tombol = document.querySelector("#hitung");
let jumlah = 0;

tombol.addEventListener("click", () => {
  jumlah += 1;
  document.querySelector("#hasil").textContent = \`\${jumlah} klik\`;
});
~~~

Event yang sering dipakai:

- \`click\` pada tombol dan tautan.
- \`submit\` pada formulir.
- \`input\` saat nilai berubah (setiap ketikan).
- \`change\` setelah nilai dikonfirmasi.
- \`keydown\` untuk keyboard.
- \`DOMContentLoaded\` bila skrip dimuat di \`<head>\` tanpa \`defer\`.

~~~javascript
const form = document.querySelector("#form-kontak");

form.addEventListener("submit", (event) => {
  event.preventDefault(); // hentikan pengiriman halaman penuh
  const data = new FormData(form);
  const nama = String(data.get("nama") ?? "").trim();

  if (nama.length < 2) {
    document.querySelector("#error").textContent = "Nama minimal 2 karakter.";
    return;
  }

  document.querySelector("#error").textContent = "";
  document.querySelector("#sukses").textContent = \`Terima kasih, \${nama}.\`;
  form.reset();
});
~~~

\`preventDefault()\` hanya dipakai ketika kamu benar-benar menangani perilaku default secara manual. Untuk formulir yang dikirim ke server, biarkan perilaku default berjalan.

## Event delegation

Jika daftar terus bertambah, memasang listener pada setiap item tidak efisien. Pasang satu listener pada induk dan periksa target:

~~~javascript
const daftar = document.querySelector("#daftar");

daftar.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const tombolHapus = target.closest("[data-hapus]");
  if (!tombolHapus) return;

  const item = tombolHapus.closest("li");
  item?.remove();
});
~~~

\`closest\` menelusuri ke atas sampai menemukan elemen yang cocok. Ini juga membuat elemen yang dibuat belakangan otomatis memiliki perilaku yang sama.

## Tiga jebakan umum

1. **Menjalankan skrip sebelum DOM siap.** Letakkan \`<script>\` di akhir \`<body>\` atau gunakan atribut \`defer\`.
2. **Menganggap querySelector selalu menemukan elemen.** Selalu tangani \`null\`.
3. **Menyimpan referensi DOM yang sudah diganti.** Jika kamu me-render ulang kontainer dengan \`innerHTML\`, listener lama hilang. Lebih aman membuat dan menambahkan node baru secara eksplisit.

Di latihan berikut, kamu akan membuat penghitung klik dengan pesan status yang diumumkan lewat \`aria-live\`.`,
      code: {
        language: "javascript",
        filename: "dom.js",
        caption: "Manipulasi DOM dengan textContent dan event delegation",
        code: `const daftar = document.querySelector("#daftar");
const input = document.querySelector("#item-baru");
const form = document.querySelector("#form-item");
const status = document.querySelector("#status");

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const nilai = String(input.value ?? "").trim();
  if (nilai.length === 0) {
    status.textContent = "Tulis nama item terlebih dahulu.";
    return;
  }

  const item = document.createElement("li");
  item.textContent = nilai;

  const hapus = document.createElement("button");
  hapus.type = "button";
  hapus.textContent = "Hapus";
  hapus.dataset.hapus = "true";

  item.append(" ", hapus);
  daftar.append(item);

  input.value = "";
  status.textContent = \`"\${nilai}" ditambahkan.\`;
});

daftar.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (!target.dataset.hapus) return;

  target.closest("li")?.remove();
  status.textContent = "Item dihapus.";
});`,
      },
      exercise: {
        title: "Penghitung klik yang bisa diakses",
        brief:
          "Buat penghitung yang memperbarui teks dan mengumumkan perubahan ke pembaca layar. Tombol reset harus mengembalikan nilai ke nol.",
        steps: [
          "Ambil elemen #angka, #tambah, #reset, dan #pengumuman dengan querySelector.",
          "Tambahkan event click pada tombol tambah untuk menambah nilai.",
          "Perbarui textContent #angka setiap kali nilai berubah.",
          "Isi #pengumuman (aria-live=polite) dengan kalimat seperti 'Jumlah klik: 3'.",
          "Reset mengembalikan angka ke 0 dan memperbarui pengumuman.",
        ],
        hint: "Simpan nilai dalam variabel let di luar handler. Panggil satu fungsi render() setelah setiap perubahan agar teks dan pengumuman selalu konsisten.",
        starter: {
          html: `<main>
  <h1>Penghitung Klik</h1>
  <p class="angka" id="angka">0</p>
  <div class="aksi">
    <button id="tambah" type="button">Tambah</button>
    <button id="reset" type="button">Reset</button>
  </div>
  <p id="pengumuman" class="sr" aria-live="polite"></p>
</main>`,
          css: `body {
  font-family: system-ui, sans-serif;
  padding: 1.5rem;
  color: #26251f;
}

main { max-width: 24rem; }

.angka {
  font-size: 3rem;
  font-weight: 600;
  margin: 0.5rem 0;
  font-variant-numeric: tabular-nums;
}

.aksi { display: flex; gap: 0.5rem; }

button {
  padding: 0.5rem 0.9rem;
  border: 1px solid #cbc5b6;
  border-radius: 6px;
  background: #fff;
  font: inherit;
  cursor: pointer;
}

button:focus-visible { outline: 2px solid #1e4c3d; outline-offset: 2px; }

.sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}`,
          js: `const angka = document.querySelector("#angka");
const tombolTambah = document.querySelector("#tambah");
const tombolReset = document.querySelector("#reset");
const pengumuman = document.querySelector("#pengumuman");

let jumlah = 0;

// TODO: buat fungsi render yang memperbarui #angka dan #pengumuman
// TODO: pasang event click pada tombol tambah
// TODO: pasang event click pada tombol reset
`,
        },
      },
    },
    {
      slug: "js-proyek-daftar-tugas",
      title: "Proyek: daftar tugas interaktif",
      summary:
        "Menggabungkan state, fungsi render, event delegation, dan aksesibilitas menjadi satu komponen utuh.",
      estimatedMinutes: 36,
      content: `Proyek ini menggabungkan semua konsep JavaScript sebelumnya. Kita akan membangun daftar tugas kecil dengan state di memori, render ulang yang terkontrol, serta status kosong yang jelas.

## Prinsip: state dulu, tampilan kemudian

Kesalahan umum pemula adalah membaca nilai dari DOM, mengubah DOM, lalu membaca lagi. Pola itu membuat state tersebar dan sulit diuji.

Pola yang lebih baik:

1. Simpan data di satu variabel (\`tugas\`).
2. Ubah data lewat fungsi kecil.
3. Panggil \`render()\` untuk menyesuaikan tampilan.

~~~javascript
let tugas = [
  { id: 1, judul: "Baca lesson DOM", selesai: true },
  { id: 2, judul: "Kerjakan latihan penghitung", selesai: false },
];
~~~

## Fungsi render

\`render()\` selalu menggambar ulang daftar dari state. Dengan begitu, tampilan tidak mungkin berbeda dari data.

~~~javascript
const daftar = document.querySelector("#daftar-tugas");
const kosong = document.querySelector("#status-kosong");

function render() {
  daftar.replaceChildren();

  for (const item of tugas) {
    const li = document.createElement("li");
    li.className = item.selesai ? "tugas selesai" : "tugas";

    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = item.selesai;
    checkbox.dataset.id = String(item.id);

    const teks = document.createElement("span");
    teks.textContent = item.judul;

    label.append(checkbox, teks);
    li.append(label);
    daftar.append(li);
  }

  kosong.hidden = tugas.length > 0;
}
~~~

Perhatikan penggunaan \`textContent\` untuk judul tugas: input pengguna diperlakukan sebagai teks, bukan HTML.

## Menambah tugas

~~~javascript
const form = document.querySelector("#form-tugas");
const input = document.querySelector("#judul-tugas");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const judul = input.value.trim();

  if (judul.length < 3) {
    input.setAttribute("aria-invalid", "true");
    document.querySelector("#error").textContent = "Judul minimal 3 karakter.";
    return;
  }

  input.removeAttribute("aria-invalid");
  document.querySelector("#error").textContent = "";

  tugas.push({ id: Date.now(), judul, selesai: false });
  input.value = "";
  render();
  input.focus();
});
~~~

Memberi fokus kembali ke input setelah submit membuat penggunaan keyboard lebih nyaman.

## Mengubah status

Karena checkbox dibuat ulang setiap render, kita memakai event delegation pada kontainer:

~~~javascript
daftar.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  if (target.type !== "checkbox") return;

  const id = Number(target.dataset.id);
  tugas = tugas.map((item) =>
    item.id === id ? { ...item, selesai: target.checked } : item,
  );

  render();
});
~~~

\`map\` dengan spread membuat object baru, bukan mengubah object lama. Pola ini membuat perubahan state lebih mudah dilacak.

## Menghapus tugas

~~~javascript
daftar.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const tombol = target.closest("[data-hapus]");
  if (!tombol) return;

  const id = Number(tombol.getAttribute("data-hapus"));
  tugas = tugas.filter((item) => item.id !== id);
  render();
});
~~~

Pastikan tombol hapus berada di luar label agar klik hapus tidak sekaligus mengubah checkbox.

## Ringkasan progres

Tambahkan elemen yang menunjukkan jumlah selesai:

~~~javascript
function ringkas() {
  const selesai = tugas.filter((item) => item.selesai).length;
  return \`\${selesai} dari \${tugas.length} tugas selesai.\`;
}

function renderRingkasan() {
  document.querySelector("#ringkasan").textContent = ringkas();
}
~~~

Panggil \`renderRingkasan()\` di akhir \`render()\`.

## Aksesibilitas yang tidak boleh dilewatkan

- Setiap checkbox berada di dalam \`<label>\` sehingga teksnya dapat diklik.
- Status kosong berada di elemen dengan \`role="status"\` agar tidak mengganggu.
- Pesan kesalahan dihubungkan ke input dengan \`aria-describedby\`.
- Tombol hapus memiliki label yang jelas, bukan hanya ikon tanpa teks alternatif.
- Urutan fokus mengikuti urutan visual.

## Pengembangan lanjutan

Setelah versi dasar berjalan, coba:

- Filter "semua / aktif / selesai" dengan tombol.
- Edit judul dengan klik dua kali.
- Simpan ke penyimpanan browser (perhatikan bahwa iframe playground dibatasi, jadi fitur ini diuji di halaman biasa).

Latihan berikut meminta kamu menyelesaikan semua bagian inti. Fokus pada alur state → render → event, bukan menambah fitur.`,
      code: {
        language: "javascript",
        filename: "tugas.js",
        caption: "State array, render ulang, dan event delegation",
        code: `let tugas = [];
let idBerikutnya = 1;

const form = document.querySelector("#form-tugas");
const input = document.querySelector("#judul");
const daftar = document.querySelector("#daftar");
const statusKosong = document.querySelector("#kosong");

function render() {
  daftar.replaceChildren();

  for (const item of tugas) {
    const li = document.createElement("li");

    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = item.selesai;
    checkbox.dataset.id = String(item.id);

    const teks = document.createElement("span");
    teks.textContent = item.judul;

    label.append(checkbox, teks);
    li.append(label);
    daftar.append(li);
  }

  statusKosong.hidden = tugas.length > 0;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const judul = input.value.trim();
  if (judul.length < 3) return;

  tugas.push({ id: idBerikutnya++, judul, selesai: false });
  input.value = "";
  render();
});

daftar.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;

  tugas = tugas.map((item) =>
    item.id === Number(target.dataset.id)
      ? { ...item, selesai: target.checked }
      : item,
  );
});

render();`,
      },
      exercise: {
        title: "Selesaikan daftar tugas",
        brief:
          "Lengkapi komponen daftar tugas: tambah, centang, hapus, dan status kosong. Semua perubahan harus melalui render ulang dari state.",
        steps: [
          "Lengkapi fungsi render agar membuat satu <li> untuk setiap tugas, dengan checkbox di dalam label.",
          "Tangani submit form: validasi judul minimal 3 karakter, tambahkan tugas baru, lalu render.",
          "Tangani change pada checkbox untuk mengubah status selesai memakai map.",
          "Tambahkan tombol hapus dengan data-hapus dan tangani kliknya memakai filter.",
          "Sembunyikan pesan kosong ketika daftar berisi tugas, dan tampilkan ketika kosong.",
        ],
        hint: "Setiap handler hanya mengubah array tugas lalu memanggil render(). Jangan mengubah DOM secara manual di beberapa tempat.",
        starter: {
          html: `<main>
  <h1>Daftar Tugas</h1>
  <form id="form-tugas">
    <label for="judul">Tugas baru</label>
    <div class="baris">
      <input id="judul" name="judul" type="text" placeholder="Misal: latihan DOM" />
      <button type="submit">Tambah</button>
    </div>
    <p id="error" role="alert" class="error"></p>
  </form>

  <p id="kosong" role="status">Belum ada tugas. Tambahkan satu untuk memulai.</p>
  <ul id="daftar"></ul>
</main>`,
          css: `body {
  font-family: system-ui, sans-serif;
  padding: 1.5rem;
  color: #26251f;
  line-height: 1.6;
}

main { max-width: 30rem; }

.baris { display: flex; gap: 0.5rem; }

input[type="text"] {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #cbc5b6;
  border-radius: 6px;
  font: inherit;
}

input[aria-invalid="true"] { border-color: #a72a1f; }

button {
  padding: 0.5rem 0.9rem;
  border: 1px solid #1e4c3d;
  border-radius: 6px;
  background: #1e4c3d;
  color: #fff;
  font: inherit;
  cursor: pointer;
}

ul { list-style: none; padding: 0; }

li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid #e3dfd4;
}

li label { display: flex; align-items: center; gap: 0.5rem; }

.tugas-selesai span { text-decoration: line-through; color: #6a675e; }

.hapus {
  background: transparent;
  color: #a72a1f;
  border-color: #e3dfd4;
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
}

.error { color: #a72a1f; font-size: 0.85rem; min-height: 1.2em; margin: 0.35rem 0 0; }

[hidden] { display: none !important; }`,
          js: `let tugas = [
  { id: 1, judul: "Baca lesson DOM", selesai: true },
];
let idBerikutnya = 2;

const form = document.querySelector("#form-tugas");
const input = document.querySelector("#judul");
const daftar = document.querySelector("#daftar");
const kosong = document.querySelector("#kosong");
const error = document.querySelector("#error");

function render() {
  daftar.replaceChildren();

  // TODO: buat <li> untuk setiap tugas.
  // Setiap li berisi label + checkbox (data-id), span judul, dan tombol hapus (data-hapus).
  // Tandai li dengan class "tugas-selesai" bila item.selesai.

  kosong.hidden = tugas.length > 0;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  // TODO: validasi judul minimal 3 karakter, set aria-invalid dan pesan error
  // TODO: tambahkan tugas baru, kosongkan input, render, lalu fokuskan input
});

daftar.addEventListener("change", (event) => {
  // TODO: ubah status selesai memakai map
});

daftar.addEventListener("click", (event) => {
  // TODO: hapus tugas memakai filter ketika tombol data-hapus diklik
});

render();
`,
        },
      },
    },
  ],
  quiz: {
    title: "Quiz JavaScript Fundamentals",
    description:
      "Enam pertanyaan tentang tipe data, kondisi, fungsi, array, dan DOM. Nilai minimal 80%.",
    questions: [
      {
        id: "js-q1",
        prompt: "Apa hasil dari kode berikut?",
        code: 'console.log(0 == "");\nconsole.log(0 === "");',
        codeLanguage: "javascript",
        options: [
          { id: "a", text: "true lalu true" },
          { id: "b", text: "true lalu false" },
          { id: "c", text: "false lalu false" },
          { id: "d", text: "false lalu true" },
        ],
        correctOptionId: "b",
        explanation:
          "Operator == melakukan konversi tipe sehingga 0 dan string kosong dianggap sama. === membandingkan tipe sekaligus, sehingga hasilnya false.",
      },
      {
        id: "js-q2",
        prompt: "Nilai mana yang dianggap falsy dalam kondisi JavaScript?",
        options: [
          { id: "a", text: "[] (array kosong)" },
          { id: "b", text: "{} (object kosong)" },
          { id: "c", text: "0" },
          { id: "d", text: '"false"' },
        ],
        correctOptionId: "c",
        explanation:
          "0, -0, 0n, \"\", null, undefined, dan NaN adalah falsy. Array dan object kosong tetap truthy.",
      },
      {
        id: "js-q3",
        prompt: "Apa yang dikembalikan oleh array.map()?",
        options: [
          { id: "a", text: "Item pertama yang lolos kondisi" },
          { id: "b", text: "Array baru dengan panjang yang sama berisi hasil transformasi" },
          { id: "c", text: "Nilai boolean" },
          { id: "d", text: "Array asli yang sudah diurutkan" },
        ],
        correctOptionId: "b",
        explanation:
          "map membuat array baru dengan panjang sama. filter memilih sebagian item, find mengembalikan satu item, dan reduce merangkum menjadi satu nilai.",
      },
      {
        id: "js-q4",
        prompt:
          "Mengapa innerHTML berisiko ketika dipakai untuk menampilkan input pengguna?",
        options: [
          { id: "a", text: "Karena innerHTML lebih lambat dari textContent" },
          {
            id: "b",
            text: "Karena string diperlakukan sebagai HTML sehingga dapat mengeksekusi markup berbahaya (XSS)",
          },
          { id: "c", text: "Karena innerHTML tidak didukung di mobile" },
          { id: "d", text: "Karena innerHTML menghapus semua event listener" },
        ],
        correctOptionId: "b",
        explanation:
          "innerHTML mem-parsing HTML. Input pengguna yang berisi tag atau skrip dapat merusak halaman atau mencuri data. Gunakan textContent untuk data pengguna.",
      },
      {
        id: "js-q5",
        prompt: "Apa perbedaan let dan const?",
        options: [
          { id: "a", text: "const tidak dapat diubah sama sekali, termasuk isi object" },
          {
            id: "b",
            text: "const tidak dapat di-reassign, tetapi isi object/array masih dapat diubah",
          },
          { id: "c", text: "let hanya berlaku di dalam fungsi, const di dalam blok" },
          { id: "d", text: "Keduanya identik" },
        ],
        correctOptionId: "b",
        explanation:
          "const mengikat nama ke nilai tertentu. Mutasi properti object tetap diperbolehkan; yang dilarang adalah mengganti binding-nya.",
      },
      {
        id: "js-q6",
        prompt:
          "Kamu memasang satu event listener pada <ul> dan memeriksa target untuk menangani klik pada setiap <li>. Teknik ini disebut?",
        options: [
          { id: "a", text: "Event delegation" },
          { id: "b", text: "Event bubbling prevention" },
          { id: "c", text: "Mutation observer" },
          { id: "d", text: "Callback hell" },
        ],
        correctOptionId: "a",
        explanation:
          "Event delegation memanfaatkan bubbling: event dari anak naik ke induk, sehingga satu listener dapat menangani banyak elemen, termasuk yang dibuat belakangan.",
      },
    ],
  },
};
