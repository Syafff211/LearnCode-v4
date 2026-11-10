-- Seed a small, substantive Indonesian editorial library. The posts are
-- intentionally authored by the LearnCode publisher fallback; no people,
-- testimonials, ratings, prices, or credentials are invented here.

insert into public.blog_categories (slug, name, description)
values
  ('web-fundamentals', 'Fondasi Web', 'Konsep dasar dokumen web, browser, dan struktur halaman.'),
  ('html-css', 'HTML & CSS', 'Struktur semantik, formulir, styling, dan tata letak responsif.'),
  ('javascript', 'JavaScript', 'Dasar bahasa, fungsi, DOM, event, dan debugging di browser.'),
  ('frontend', 'Frontend', 'Cara menyusun antarmuka web yang dapat dipelihara dan digunakan.'),
  ('belajar-coding', 'Belajar Coding', 'Strategi latihan dan proyek kecil untuk membangun pemahaman.')
on conflict (slug) do nothing;

insert into public.blog_posts (
  category_id, related_course_id, slug, title, excerpt, content_md, author_name,
  cover_image, cover_image_alt, seo_title, seo_description, status,
  published_at, reading_minutes
)
values
(
  (select id from public.blog_categories where slug = 'web-fundamentals'),
  (select id from public.courses where slug = 'html-fundamentals' and status = 'published'),
  'html-struktur-semantik',
  'HTML bukan cuma div: cara menyusun halaman semantik',
  'Kenali peran elemen header, nav, main, section, article, dan footer agar struktur halaman mudah dipahami manusia maupun teknologi bantu.',
  $md$HTML sering terasa seperti kumpulan tag yang hanya menjadi wadah untuk CSS. Padahal, elemen yang dipilih juga menjelaskan **makna dan struktur** konten. Browser, mesin pencari, pembaca layar, dan developer lain menggunakan struktur itu untuk memahami halaman.

## Mulai dari kerangka dokumen

Dokumen HTML yang baik memiliki deklarasi doctype, bahasa dokumen, metadata dasar, dan satu area konten yang jelas. Atribut `lang` sebaiknya mencerminkan bahasa utama halaman karena pembaca layar menggunakannya untuk memilih pelafalan.

```html
<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Catatan Belajar</title>
  </head>
  <body>
    <header>...</header>
    <main>...</main>
    <footer>...</footer>
  </body>
</html>
```

`header` dan `footer` dapat dipakai untuk area pengantar atau penutup halaman maupun sebuah bagian. `main` menandai konten utama halaman; umumnya cukup satu elemen utama yang terlihat. Jangan memilih tag hanya karena bentuk default-nya cocok—presentasi adalah tugas CSS.

## Pilih elemen berdasarkan makna

`nav` cocok untuk kumpulan tautan navigasi yang penting. `article` masuk akal untuk konten yang dapat berdiri sendiri, seperti artikel blog atau kartu berita. `section` mengelompokkan tema dan biasanya memiliki heading. Jika sebuah elemen tidak membawa makna khusus dan hanya diperlukan untuk layout, `div` tetap pilihan yang tepat.

Heading bukan alat untuk memperbesar teks. Mulailah dengan satu judul halaman yang jelas, lalu gunakan `h2` dan `h3` untuk membentuk hierarki. Jangan melompat tingkat hanya demi ukuran visual; ukuran dapat diatur lewat CSS.

## Semantik membantu aksesibilitas

Elemen native biasanya sudah memiliki perilaku keyboard dan peran yang dikenal teknologi bantu. Tautan seharusnya memakai `a` dengan `href`; aksi yang mengubah keadaan halaman seharusnya memakai `button`. Mengubah `div` menjadi tombol dengan `onClick` saja tidak otomatis memberikan fokus keyboard, aktivasi Enter/Space, atau nama aksesibel.

Teks alternatif gambar perlu menyampaikan informasi gambar yang relevan. Untuk gambar dekoratif yang tidak menambah makna, `alt=""` mencegah pembaca layar membacakan detail yang tidak perlu. Pelajari struktur, tautan, gambar, dan formulir lewat [kursus HTML Fundamentals](/courses/html-fundamentals), terutama [lesson dokumen dan struktur semantik](/learn/html-dokumen-dan-struktur).

## Checklist sebelum lanjut ke CSS

Buka halaman tanpa styling dan periksa apakah judul serta urutan bagian masih masuk akal. Pastikan tautan memiliki tujuan, heading menggambarkan isi, dan elemen interaktif benar-benar native. Struktur yang jelas membuat CSS lebih mudah diatur dan JavaScript lebih mudah ditambahkan tanpa mengorbankan aksesibilitas.$md$,
  'LearnCode', null, null,
  'Struktur HTML semantik: panduan praktis | LearnCode',
  'Pelajari kerangka dokumen HTML, elemen semantik, hierarki heading, dan cara memilih elemen yang lebih aksesibel.',
  'published', now(), 5
),
(
  (select id from public.blog_categories where slug = 'html-css'),
  (select id from public.courses where slug = 'html-fundamentals' and status = 'published'),
  'html-form-aksesibel',
  'Form HTML yang nyaman dipakai semua orang',
  'Label, tipe input, instruksi, dan umpan balik yang jelas membuat formulir lebih mudah digunakan dengan mouse, keyboard, dan pembaca layar.',
  $md$Formulir adalah salah satu titik paling penting dalam antarmuka web. Pengguna mengandalkannya untuk mencari, mendaftar, mengirim pesan, atau menyimpan data. Form yang tampil sederhana tetap bisa membingungkan jika label tidak jelas atau pesan kesalahan hanya berupa warna.

## Hubungkan label dengan kontrol

Gunakan `label` yang terhubung ke `id` input. Klik pada label akan memindahkan fokus ke kontrol, dan teknologi bantu dapat mengumumkan nama field dengan benar.

```html
<label for="email">Alamat email</label>
<input id="email" name="email" type="email" autocomplete="email" required>
```

`name` menentukan nama field saat form dikirim; `id` membantu menghubungkan label dan instruksi. `placeholder` bukan pengganti label karena teksnya hilang ketika pengguna mulai mengetik dan sering memiliki kontras rendah.

## Pilih tipe input dan instruksi yang sesuai

Pakai `type="email"` untuk alamat email, `type="password"` untuk kata sandi, dan `type="number"` hanya untuk nilai yang memang numerik. Atribut seperti `autocomplete`, `required`, `min`, dan `maxlength` memberi petunjuk kepada browser, tetapi tidak menggantikan validasi server ketika data disimpan.

Jika field membutuhkan penjelasan, hubungkan instruksi melalui `aria-describedby`:

```html
<p id="password-help">Gunakan minimal 12 karakter.</p>
<input id="password" name="password" type="password" aria-describedby="password-help">
```

Jangan menyampaikan kesalahan hanya lewat warna merah. Tampilkan teks yang menjelaskan apa yang perlu diperbaiki, letakkan dekat dengan field terkait, dan pastikan pesan dapat ditemukan pembaca layar. Untuk form panjang, ringkasan kesalahan di bagian atas dapat membantu pengguna langsung menuju masalah.

## Pertahankan alur keyboard

Uji form dengan Tab, Shift+Tab, Enter, dan tombol panah pada kontrol pilihan. Urutan fokus harus mengikuti urutan baca, indikator fokus harus terlihat, dan tombol submit perlu memiliki label yang menjelaskan aksinya. Jangan memakai `div` sebagai tombol kirim.

Setelah submit gagal, jangan menghapus nilai yang telah dimasukkan. Pertahankan data, umumkan status pengiriman, dan pindahkan fokus secara terukur hanya jika membantu. Validasi sisi browser berguna untuk umpan balik cepat, sedangkan server tetap perlu memvalidasi ulang nilai.

Lihat contoh langkah demi langkah di [lesson formulir aksesibel](/learn/html-formulir-aksesibilitas) dan pelajari elemen HTML lainnya melalui [HTML Fundamentals](/courses/html-fundamentals). Mulailah dengan satu form sederhana, lalu periksa apakah instruksi, error, dan submit dapat dipahami tanpa melihat warna atau menggunakan mouse.$md$,
  'LearnCode', null, null,
  'Membuat form HTML yang aksesibel | LearnCode',
  'Panduan form HTML: label, atribut input, instruksi, pesan error, keyboard, dan validasi sisi server.',
  'published', now(), 5
),
(
  (select id from public.blog_categories where slug = 'html-css'),
  (select id from public.courses where slug = 'css-fundamentals' and status = 'published'),
  'css-cascade-specificity',
  'CSS cascade dan specificity tanpa tebak-tebakan',
  'Pahami urutan cascade, asal deklarasi, specificity, dan source order supaya aturan CSS lebih mudah diprediksi dan dirawat.',
  $md$Ketika sebuah elemen terlihat berbeda dari yang diharapkan, menambahkan selector yang lebih panjang sering terasa seperti solusi cepat. Kebiasaan itu membuat stylesheet makin sulit dipahami. Lebih baik ikuti proses cascade secara berurutan.

## Cascade bukan sekadar siapa yang paling spesifik

Browser membandingkan deklarasi yang berlaku untuk properti yang sama. Urutan cascade mencakup origin dan importance, cascade layer, specificity, kedekatan deklarasi tertentu, lalu urutan kemunculan. Karena itu, membandingkan jumlah class saja belum selalu menjelaskan hasil akhirnya.

Untuk aturan normal dari stylesheet penulis, specificity baru dibandingkan setelah prioritas layer. Deklarasi `!important` mengubah urutan prioritas dan sebaiknya tidak dipakai sebagai cara rutin untuk menang.

## Hitung specificity secara konsisten

Secara praktis, specificity dapat dibaca sebagai tiga kelompok: ID, class/atribut/pseudo-class, lalu nama elemen/pseudo-element. Contoh `#menu .item` lebih spesifik daripada `.item a` karena memiliki selector ID. Jika dua deklarasi memiliki prioritas dan specificity sama, deklarasi yang muncul belakangan biasanya menang.

```css
.card a { color: navy; }
.card .link { color: seagreen; }
```

Selector kedua memiliki dua class, sedangkan yang pertama memiliki satu class dan satu elemen. Specificity keduanya dibandingkan per kelompok, bukan dengan menjumlahkan semua token menjadi satu angka biasa.

`:where(...)` selalu memberikan specificity nol, sehingga berguna untuk membuat selector dasar yang mudah ditimpa. `:is(...)` mengambil specificity tertinggi dari argumennya. Pseudo-class seperti `:hover` tetap memiliki specificity seperti class.

## Cara memperbaiki konflik

Pertama, buka panel Styles atau Computed pada DevTools dan lihat deklarasi mana yang menang serta aturan mana yang dicoret. Pastikan selector benar-benar mencocokkan elemen, lalu periksa apakah properti diwariskan atau ditimpa di layer lain. Hindari langsung menambah `!important`.

Jika konflik berulang, sederhanakan struktur class, rapikan urutan import, atau tetapkan cascade layer seperti `reset`, `base`, `components`, dan `utilities`. Aturan komponen yang konsisten biasanya lebih mudah dirawat daripada selector bertingkat panjang.

Latih selector dan cascade di [lesson CSS Fundamentals](/learn/css-selektor-cascade), lalu lanjutkan ke [kursus CSS Fundamentals](/courses/css-fundamentals). Tujuannya bukan membuat selector paling kuat, melainkan membuat keputusan styling yang dapat dijelaskan.$md$,
  'LearnCode', null, null,
  'CSS cascade dan specificity dengan contoh | LearnCode',
  'Pahami cascade, specificity, layers, source order, dan langkah debugging konflik CSS.',
  'published', now(), 5
),
(
  (select id from public.blog_categories where slug = 'html-css'),
  (select id from public.courses where slug = 'css-fundamentals' and status = 'published'),
  'css-box-model-responsive',
  'Box model CSS: kenapa elemen lebih lebar dari perkiraan?',
  'Kenali content, padding, border, dan margin agar ukuran komponen lebih mudah dikendalikan pada berbagai lebar layar.',
  $md$Sebuah kartu dengan `width: 300px` dapat terlihat lebih lebar dari 300 piksel. Penyebab yang paling umum adalah box model: ukuran CSS dapat mengacu hanya pada area konten, sementara padding dan border menambah lebar yang terlihat.

## Empat bagian box model

Dari dalam ke luar, sebuah kotak terdiri dari content, padding, border, lalu margin. Dengan `box-sizing: content-box`, deklarasi `width` hanya mengatur content. Jika lebar 300 piksel memiliki padding 20 piksel di kiri dan kanan serta border 1 piksel, lebar luar menjadi 342 piksel.

`box-sizing: border-box` membuat `width` mencakup content, padding, dan border. Banyak proyek menerapkan aturan ini secara global karena ukuran komponen menjadi lebih mudah diperkirakan.

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}
```

Margin berada di luar kotak dan dapat memiliki aturan collapse pada block layout biasa. Dalam flex atau grid, jarak antaritem sering lebih mudah diatur dengan `gap`.

## Hindari ukuran kaku yang rapuh

Lebar tetap cocok untuk kontrol kecil dengan batas yang jelas, tetapi dapat menyebabkan overflow pada layar sempit. Untuk konten, gunakan kombinasi lebar maksimum dan lebar cair, misalnya `width: min(100% - 2rem, 70rem)`. `min()`, `max()`, dan `clamp()` memungkinkan batas responsif tanpa banyak breakpoint.

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
  gap: 1rem;
}
```

Pada grid, `minmax(0, 1fr)` dapat membantu ketika konten panjang memaksa kolom melebar. Pada flex item, `min-width: 0` sering diperlukan agar teks dapat membungkus alih-alih mendorong layout keluar layar.

## Debug ukuran yang tidak cocok

Periksa computed width pada DevTools, lalu lihat box model yang divisualisasikan browser. Pastikan padding, border, min-width, dan konten panjang ikut dipertimbangkan. Hindari memberi tinggi tetap pada elemen berisi teks; gunakan padding dan biarkan tinggi mengikuti konten.

Untuk berlatih, ikuti [lesson box model dan tipografi](/learn/css-box-model-tipografi), kemudian susun layout dengan [Flexbox dan Grid](/learn/css-flexbox-grid). Ukuran yang fleksibel dan ruang yang konsisten membuat antarmuka lebih tahan terhadap teks, bahasa, dan layar yang berbeda.$md$,
  'LearnCode', null, null,
  'Box model CSS dan layout responsif | LearnCode',
  'Panduan box model CSS, box-sizing, gap, minmax, dan debugging ukuran komponen.',
  'published', now(), 5
),
(
  (select id from public.blog_categories where slug = 'frontend'),
  (select id from public.courses where slug = 'css-fundamentals' and status = 'published'),
  'css-flexbox-vs-grid',
  'Flexbox atau Grid? Pilih layout dari bentuk masalahnya',
  'Gunakan Flexbox untuk alur satu dimensi dan Grid untuk hubungan baris-kolom; contoh ini membantu memilih tanpa menjadikannya aturan kaku.',
  $md$Flexbox dan CSS Grid sama-sama dapat menyusun layout modern. Memilih salah satunya bukan soal mana yang lebih baru, melainkan arah hubungan antaritem dan kebutuhan terhadap baris maupun kolom.

## Flexbox mengatur satu sumbu utama

Flexbox paling nyaman ketika item bergerak dalam satu baris atau satu kolom. Navigasi, tombol berderet, header dengan logo dan aksi, serta daftar chip adalah contoh umum. `justify-content` mengatur distribusi di sumbu utama, sedangkan `align-items` mengatur perataan pada sumbu silang.

```css
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
```

Item dapat membungkus dengan `flex-wrap: wrap`. Namun, baris yang telah membungkus tetap tidak saling menyelaraskan kolom seperti sistem grid dua dimensi.

## Grid mengatur baris dan kolom bersama-sama

Gunakan Grid untuk galeri, kartu katalog, dashboard, atau layout yang perlu hubungan konsisten pada kedua sumbu. `grid-template-columns` menentukan struktur kolom; baris dapat terbentuk otomatis mengikuti isi.

```css
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 17rem), 1fr));
  gap: 1rem;
}
```

`auto-fit` dan `minmax()` memberi kolom kesempatan menyesuaikan lebar kontainer. Untuk layout halaman, Grid juga dapat menyatakan area seperti sidebar dan konten utama secara eksplisit.

## Pilih berdasarkan kebutuhan, bukan kebiasaan

Tanyakan: apakah item perlu mengalir sepanjang satu sumbu, atau perlu membentuk baris dan kolom yang saling terkait? Jika satu, Flexbox biasanya ringkas. Jika dua, Grid biasanya lebih jelas. Keduanya dapat bekerja bersama: Grid untuk kerangka halaman dan Flexbox untuk isi kartu.

Periksa responsivitas dengan konten nyata, bukan hanya kotak kosong. Teks panjang, tombol yang membungkus, dan layar sempit sering menunjukkan masalah min-width yang tidak terlihat pada mockup. Hindari memaksa semua item punya tinggi tetap jika isi tiap kartu berbeda.

Coba susun komponen sederhana setelah mengikuti [lesson Flexbox dan Grid](/learn/css-flexbox-grid) atau [kursus CSS Fundamentals](/courses/css-fundamentals). Jika aturan layout sulit dijelaskan, sederhanakan struktur sebelum menambah media query baru.$md$,
  'LearnCode', null, null,
  'CSS Flexbox vs Grid: kapan menggunakannya | LearnCode',
  'Perbandingan Flexbox dan CSS Grid berdasarkan sumbu layout, contoh penggunaan, dan responsivitas.',
  'published', now(), 4
),
(
  (select id from public.blog_categories where slug = 'javascript'),
  (select id from public.courses where slug = 'javascript-fundamentals' and status = 'published'),
  'javascript-variabel-tipe',
  'let, const, dan tipe data JavaScript yang sering membingungkan',
  'Pahami binding, nilai primitif, objek, konversi tipe, dan perbandingan agar kondisi JavaScript lebih dapat diprediksi.',
  $md$Banyak bug JavaScript berawal dari asumsi bahwa nilai memiliki tipe atau perilaku yang berbeda dari kenyataannya. Memahami variabel dan tipe data sejak awal membuat kondisi, perhitungan, dan input form lebih aman.

## Pilih const atau let berdasarkan reassignment

Gunakan `const` ketika sebuah binding tidak akan diarahkan ke nilai lain. Gunakan `let` jika nilainya memang perlu diperbarui. `const` tidak membuat isi array atau object menjadi beku; ia hanya mencegah binding diganti.

```js
const name = "Ayu";
let total = 0;
total += 1;

const topics = ["HTML", "CSS"];
topics.push("JavaScript"); // array boleh berubah, binding tetap sama
```

`var` memiliki function scope dan perilaku hoisting yang berbeda. Untuk kode baru, `let` dan `const` umumnya lebih mudah dibatasi ke block tempat nilainya digunakan.

## Bedakan nilai dan konversi tipe

String dari input form tetap berupa string. `Number("42")` menghasilkan angka 42, sedangkan input kosong dapat menghasilkan 0 ketika dikonversi dengan cara tertentu. Karena itu, periksa nilai sebelum menghitung.

```js
const raw = "42";
const amount = Number(raw);

if (raw.trim() !== "" && Number.isFinite(amount)) {
  console.log(amount + 1);
}
```

Nilai primitif seperti string, number, boolean, `null`, dan `undefined` berbeda dari object dan array. Gunakan `===` untuk perbandingan ketat agar JavaScript tidak melakukan konversi implisit yang mengejutkan. Periksa juga `null` dan `undefined` jika keduanya mungkin muncul dari sumber berbeda.

## Jangan mengandalkan truthy/falsy tanpa memahami nilainya

String kosong dan angka nol bersifat falsy, sedangkan array kosong dan object kosong bersifat truthy. Kondisi `if (items)` tidak memastikan array memiliki elemen; gunakan `items.length > 0` jika memang ingin memeriksa isinya.

Untuk data eksternal, validasi bentuk dan rentang nilai sebelum digunakan. Tipe statis dari editor membantu saat menulis, tetapi tidak menggantikan pemeriksaan nilai yang diterima dari pengguna atau jaringan.

Pelajari variabel, tipe, dan operator melalui [lesson JavaScript Fundamentals](/learn/js-variabel-tipe-operator), lalu gunakan konsepnya dalam [kursus JavaScript Fundamentals](/courses/javascript-fundamentals). Latihan terbaik adalah menuliskan nilai yang diharapkan, lalu mengujinya dengan input normal, kosong, dan tidak valid.$md$,
  'LearnCode', null, null,
  'Variabel dan tipe data JavaScript untuk pemula | LearnCode',
  'Panduan let, const, tipe data, konversi nilai, perbandingan ketat, dan truthy/falsy JavaScript.',
  'published', now(), 5
),
(
  (select id from public.blog_categories where slug = 'javascript'),
  (select id from public.courses where slug = 'javascript-fundamentals' and status = 'published'),
  'javascript-fungsi-scope',
  'Fungsi dan scope: pecah logika supaya mudah dirawat',
  'Pelajari parameter, return, block scope, closure, dan metode array untuk membuat fungsi kecil yang mudah diuji.',
  $md$Fungsi memberi nama pada satu pekerjaan yang dapat digunakan kembali. Fungsi yang ringkas membantu menjelaskan niat kode, memisahkan aturan dari tampilan, dan memudahkan pengujian.

## Bedakan parameter dan nilai balik

Parameter adalah masukan; `return` adalah hasil. Jika sebuah fungsi menghitung nilai, kembalikan hasilnya daripada hanya mencetak ke console. Dengan begitu, pemanggil dapat memutuskan apakah nilai ditampilkan, disimpan, atau dipakai untuk perhitungan lain.

```js
function formatPrice(value) {
  if (!Number.isFinite(value) || value < 0) return "Harga tidak valid";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(value);
}
```

Fungsi di atas tidak mengubah elemen halaman atau variabel global. Fungsi seperti ini lebih mudah diuji karena hasilnya bergantung pada masukan yang diberikan.

## Pahami scope dan closure

`let` dan `const` memiliki block scope. Variabel yang dibuat di dalam `{ ... }` tidak otomatis tersedia di luar block. Closure terjadi ketika fungsi menyimpan akses ke variabel dari scope tempat fungsi tersebut dibuat. Closure bermanfaat untuk state privat dan callback, tetapi dapat membingungkan jika variabel luar berubah tanpa terlihat.

Pilih nama parameter yang jelas dan hindari membuat banyak fungsi melakukan perubahan global. Jika sebuah fungsi sekaligus mengambil data, mengubah DOM, dan menulis ke storage, pecah tanggung jawabnya.

## Gunakan metode array sesuai tujuan

`map` mengubah setiap item menjadi item baru. `filter` memilih subset. `find` mengambil satu item pertama yang cocok. `reduce` menggabungkan array menjadi satu nilai dan sebaiknya dipakai ketika proses agregasi memang lebih jelas dengannya.

```js
const activeNames = users
  .filter((user) => user.active)
  .map((user) => user.name);
```

Panggilan berantai membantu ketika setiap langkah sederhana dan nama variabel menjelaskan data. Untuk transformasi rumit, simpan hasil antara atau buat fungsi bernama agar alurnya mudah dibaca.

Coba fungsi, scope, dan pengolahan array lewat [lesson JavaScript Fundamentals](/learn/js-fungsi-scope-array). Setelah itu, refactor satu potongan kode menjadi fungsi yang memiliki satu tanggung jawab dan uji dengan nilai normal maupun batas.$md$,
  'LearnCode', null, null,
  'Fungsi, scope, dan array JavaScript | LearnCode',
  'Panduan fungsi JavaScript, parameter, return, block scope, closure, dan metode array.',
  'published', now(), 5
),
(
  (select id from public.blog_categories where slug = 'javascript'),
  (select id from public.courses where slug = 'javascript-fundamentals' and status = 'published'),
  'javascript-dom-events',
  'Event DOM: buat form interaktif tanpa mengabaikan aksesibilitas',
  'Gunakan addEventListener, submit, preventDefault, dan textContent dengan alur keyboard serta umpan balik yang jelas.',
  $md$JavaScript dapat merespons tindakan pengguna melalui event. Untuk form, event `submit` biasanya lebih tepat daripada menangani klik tombol saja karena pengguna juga dapat mengirim dengan Enter.

## Dengarkan event pada form

Pilih elemen dengan selector yang spesifik, lalu daftarkan listener. `preventDefault()` menghentikan navigasi bawaan hanya ketika aplikasi memang akan menangani submit sendiri.

```js
const form = document.querySelector("#task-form");
const input = document.querySelector("#task-title");
const status = document.querySelector("#task-status");

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = input?.value.trim();

  if (!title) {
    status.textContent = "Tulis judul tugas terlebih dahulu.";
    input?.focus();
    return;
  }

  status.textContent = `Tugas ${title} ditambahkan.`;
});
```

Contoh ini mengasumsikan elemen tersebut sudah ada saat script berjalan; letakkan script dengan `defer` atau jalankan setelah DOM siap. Pada TypeScript, tipe elemen perlu dipastikan sebelum membaca properti seperti `value`.

## Tampilkan data sebagai teks

Gunakan `textContent` untuk memasukkan teks dari pengguna ke elemen. `innerHTML` menafsirkan string sebagai markup dan dapat membuka celah injeksi jika input tidak disanitasi. Jika aplikasi benar-benar perlu membuat elemen, gunakan `document.createElement` lalu isi teksnya melalui `textContent`.

Jangan mengandalkan `event.target` selalu sebagai elemen yang sama dengan listener. Pada event yang menggelembung, target adalah sumber event terdalam; `currentTarget` adalah elemen yang memiliki listener. Delegasi event pada daftar dapat memakai pola ini, tetapi tetap periksa apakah target sesuai.

## Beri umpan balik yang bisa ditemukan

Status submit seperti pesan berhasil atau gagal dapat ditempatkan dalam elemen `role="status"` atau `aria-live="polite"` agar perubahan diumumkan tanpa memindahkan fokus. Label form harus tetap terhubung ke kontrol. Untuk error, tunjukkan teks yang menjelaskan perbaikan, bukan hanya mengubah border menjadi merah.

Uji form dengan mouse dan keyboard. Periksa Enter, urutan Tab, fokus setelah input tidak valid, dan pesan yang dibacakan. Pelajari pola DOM dan event lebih lanjut melalui [lesson DOM dan event](/learn/js-dom-event), lalu coba gabungkan dengan [kursus JavaScript Fundamentals](/courses/javascript-fundamentals).$md$,
  'LearnCode', null, null,
  'Event DOM JavaScript untuk form interaktif | LearnCode',
  'Pelajari addEventListener, event submit, preventDefault, textContent, dan aksesibilitas form.',
  'published', now(), 5
),
(
  (select id from public.blog_categories where slug = 'javascript'),
  (select id from public.courses where slug = 'javascript-fundamentals' and status = 'published'),
  'debugging-javascript',
  'Cara membaca error JavaScript dan debugging bertahap',
  'Gunakan pesan error, stack trace, breakpoint, dan pemeriksaan nilai untuk menemukan akar masalah tanpa menebak-nebak.',
  $md$Debugging bukan mencari baris untuk dihapus sampai error hilang. Tujuannya adalah menemukan kondisi yang membuat program menyimpang dari hasil yang diharapkan, lalu memperbaiki penyebabnya.

## Mulai dari reproduksi dan pesan pertama

Catat langkah sederhana untuk menghasilkan masalah: halaman apa yang dibuka, tindakan apa yang dilakukan, dan input seperti apa yang dipakai. Buka Console pada DevTools dan mulai dari error pertama yang terkait aplikasi. Error berikutnya bisa menjadi akibat berantai dari kegagalan sebelumnya.

Stack trace menunjukkan jalur pemanggilan fungsi. Klik baris yang merujuk ke file aplikasi, bukan hanya file internal browser atau library. Jika source map tersedia, gunakan versi sumber yang dapat dibaca.

## Periksa nilai saat masalah terjadi

`console.log` membantu melihat nilai, tetapi breakpoint memberi kontrol lebih baik: jeda eksekusi, telusuri call stack, dan periksa variabel lokal. Tambahkan breakpoint sebelum kondisi yang salah, lalu cek tipe dan isi nilai pada saat itu.

```js
function calculateTotal(items) {
  debugger; // hapus setelah pemeriksaan selesai
  return items.reduce((total, item) => total + item.price, 0);
}
```

Periksa asumsi yang paling dekat dengan hasil keliru: apakah `items` benar-benar array, apakah `price` berupa angka, apakah item kosong, dan apakah fungsi dipanggil lebih dari sekali? Validasi batas membuat kesalahan lebih mudah ditemukan daripada membiarkan nilai tak terduga menyebar.

## Ubah satu hal dan uji ulang

Setelah membuat hipotesis, ubah satu hal saja. Jalankan ulang langkah reproduksi yang sama dan pastikan hasilnya berubah sesuai dugaan. Jika tidak, hipotesis belum menjelaskan akar masalah. Mengubah beberapa hal sekaligus membuat sebab-akibat sulit diketahui.

Untuk masalah jaringan, periksa tab Network: status HTTP, payload, waktu, dan apakah permintaan benar-benar terkirim. Untuk layout, gunakan panel Elements dan Computed Styles. Untuk event, pastikan listener terdaftar dan event yang diharapkan memang terjadi.

## Bersihkan dan tambahkan pemeriksaan

Hapus `debugger` dan log sementara setelah selesai. Jika bug dapat terjadi lagi, tambahkan validasi, penanganan error, atau tes yang mewakili kasus tersebut. Jangan hanya menelan error dengan `catch` kosong; tampilkan status yang sesuai dan simpan detail teknis di log yang aman.

Latih variabel dan alur kontrol lewat [kursus JavaScript Fundamentals](/courses/javascript-fundamentals) serta [lesson kondisi dan perulangan](/learn/js-kondisi-perulangan). Saat menjelaskan bug kepada orang lain, sertakan langkah reproduksi, hasil yang diharapkan, hasil aktual, dan pesan error yang relevan.$md$,
  'LearnCode', null, null,
  'Debugging JavaScript di browser secara bertahap | LearnCode',
  'Panduan membaca console error, stack trace, breakpoint, Network panel, dan memperbaiki akar bug JavaScript.',
  'published', now(), 5
),
(
  (select id from public.blog_categories where slug = 'belajar-coding'),
  (select id from public.courses where slug = 'javascript-fundamentals' and status = 'published'),
  'belajar-coding-proyek-daftar-tugas',
  'Belajar coding lewat proyek kecil: mulai dari daftar tugas',
  'Pecah proyek menjadi kebutuhan, struktur HTML, gaya CSS, state, dan event kecil agar latihan tidak berhenti pada menyalin tutorial.',
  $md$Proyek kecil memberi konteks pada konsep yang dipelajari. Daftar tugas cocok untuk latihan karena melibatkan struktur HTML, styling, array, event, dan validasi input tanpa memerlukan backend.

## Tulis perilaku sebelum menulis kode

Mulailah dengan daftar kebutuhan, bukan pilihan framework. Misalnya: pengguna dapat menambahkan tugas, menandai satu tugas selesai, menghapusnya, dan melihat pesan ketika daftar masih kosong. Tentukan juga apa yang terjadi jika judul kosong atau terlalu panjang.

Urutkan pekerjaan menjadi langkah yang dapat diuji. Pertama, buat form dan daftar statis dalam HTML. Kedua, beri layout yang nyaman dengan CSS. Ketiga, simpan tugas dalam array JavaScript. Terakhir, sambungkan event submit dan tombol aksi.

## Bentuk state yang sederhana

Sebuah tugas dapat memiliki id stabil, judul, dan status selesai. Jangan memakai posisi array sebagai id karena urutan berubah ketika item dihapus.

```js
const tasks = [
  { id: crypto.randomUUID(), title: "Baca materi HTML", done: false },
];
```

Untuk latihan awal, state boleh berada di memori halaman. Setelah refresh, datanya akan hilang; jelaskan batas itu daripada membuat pengguna mengira ada penyimpanan permanen. Jika kemudian menambahkan penyimpanan browser, tentukan struktur data dan tangani data lama yang tidak valid.

## Bangun interaksi dengan aman

Tangani `submit` pada form supaya Enter berfungsi. Bersihkan whitespace dari input sebelum menambahkan item. Buat elemen DOM menggunakan API yang sesuai dan tampilkan judul lewat `textContent`, bukan `innerHTML`. Beri setiap tombol hapus nama aksesibel yang menyebut itemnya.

Setelah daftar berubah, render ulang bagian yang relevan. Untuk daftar kecil, pendekatan sederhana sudah cukup; jangan menambah arsitektur state yang rumit sebelum kebutuhan memerlukannya. Uji kondisi kosong, satu item, judul panjang, penghapusan item pertama, dan klik keyboard.

## Catat hal yang dipelajari

Setelah selesai, tulis keputusan yang dibuat: bagaimana data disimpan, kapan DOM diperbarui, dan bagaimana invalid input ditangani. Jika ada bug, reproduksi dan perbaiki satu per satu. Refleksi ini membangun pemahaman yang lebih tahan lama daripada menyelesaikan tutorial dengan menyalin setiap baris.

Untuk memulai, ikuti [JavaScript Fundamentals](/courses/javascript-fundamentals) dan praktikkan [lesson proyek daftar tugas](/learn/js-proyek-daftar-tugas). Fondasi HTML dari [kursus HTML](/courses/html-fundamentals) membantu memastikan proyek tetap semantik dan mudah digunakan.$md$,
  'LearnCode', null, null,
  'Belajar coding lewat proyek daftar tugas | LearnCode',
  'Rencana proyek coding kecil dengan HTML, CSS, JavaScript, state sederhana, event, aksesibilitas, dan pengujian manual.',
  'published', now(), 5
)
on conflict (slug) do nothing;
