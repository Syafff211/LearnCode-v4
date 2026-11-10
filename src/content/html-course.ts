import type { Course } from "@/content/types";

export const htmlCourse: Course = {
  slug: "html-fundamentals",
  title: "HTML Fundamentals",
  tagline: "Bangun fondasi halaman web yang benar dan mudah diakses.",
  description:
    "Mulai dari struktur dokumen, teks, tautan, gambar, hingga formulir yang aksesibel. Setiap lesson berisi contoh kode nyata dan latihan yang bisa langsung kamu jalankan di playground.",
  level: "pemula",
  durationMinutes: 110,
  passingScore: 80,
  position: 1,
  objectives: [
    "Menyusun dokumen HTML yang valid dengan struktur semantik yang jelas.",
    "Menggunakan elemen teks, tautan, dan gambar secara tepat, termasuk atribut aksesibilitas.",
    "Membangun formulir yang dapat digunakan dengan keyboard dan pembaca layar.",
    "Membaca contoh kode HTML dan menjelaskan fungsi setiap bagiannya.",
  ],
  lessons: [
    {
      slug: "html-dokumen-dan-struktur",
      title: "Dokumen HTML dan struktur semantik",
      summary:
        "Anatomi dokumen HTML, elemen dan atribut, serta elemen semantik yang memberi arti pada halaman.",
      estimatedMinutes: 25,
      content: `HTML adalah bahasa yang memberi **struktur dan makna** pada konten halaman web. Browser membaca HTML, membentuk pohon elemen, lalu menampilkannya. Karena itu, HTML yang rapi bukan hanya soal tampilan — ia menentukan bagaimana halaman dipahami oleh browser, mesin pencari, dan teknologi bantu seperti pembaca layar.

## Elemen, tag, dan atribut

Sebuah *elemen* HTML biasanya terdiri dari tag pembuka, isi, dan tag penutup:

~~~html
<p class="intro">Belajar HTML itu praktis.</p>
~~~

- \`<p>\` adalah nama elemen.
- \`class="intro"\` adalah *atribut* yang memberi informasi tambahan.
- \`Belajar HTML itu praktis.\` adalah konten.

Beberapa elemen tidak memiliki isi, misalnya \`<img>\`, \`<br>\`, dan \`<input>\`. Elemen seperti ini disebut *void element* dan tidak perlu tag penutup.

## Kerangka dokumen

Setiap halaman dimulai dari kerangka yang sama. Bagian ini tidak boleh dilewatkan karena menentukan cara browser menginterpretasikan dokumen.

~~~html title="index.html"
<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Profil Rani — LearnCode</title>
  </head>
  <body>
    <h1>Rani Pratama</h1>
    <p>Belajar HTML untuk membangun halaman yang rapi.</p>
  </body>
</html>
~~~

Mari kita bedah baris demi baris:

1. \`<!DOCTYPE html>\` memberi tahu browser bahwa dokumen menggunakan HTML modern.
2. \`<html lang="id">\` adalah akar dokumen. Atribut \`lang\` membantu pembaca layar memilih pelafalan yang tepat.
3. \`<head>\` menyimpan metadata yang tidak terlihat langsung: encoding, viewport, judul tab, dan tautan ke CSS.
4. \`<meta charset="UTF-8">\` memastikan karakter seperti *é*, *—*, atau huruf non-Latin tampil benar.
5. \`<meta name="viewport">\` membuat halaman menyesuaikan lebar layar perangkat mobile.
6. \`<body>\` berisi semua konten yang terlihat oleh pengguna.

> Nama file utama biasanya \`index.html\`. Saat server menerima permintaan ke sebuah direktori, file inilah yang dikirim lebih dulu.

## Elemen semantik memberi arti

Dulu orang membungkus semuanya dengan \`<div>\`. Cara itu berhasil secara tampilan, tetapi tidak memberi informasi apa pun tentang isi. HTML modern menyediakan elemen semantik yang menjelaskan peran setiap bagian:

| Elemen | Peran |
| --- | --- |
| \`<header>\` | Bagian pembuka: judul situs, navigasi, identitas halaman |
| \`<nav>\` | Kumpulan tautan navigasi utama |
| \`<main>\` | Konten utama halaman; hanya boleh ada satu per halaman |
| \`<section>\` | Kelompok konten dengan tema yang sama |
| \`<article>\` | Konten yang berdiri sendiri, seperti postingan atau kartu produk |
| \`<aside>\` | Konten pendukung di samping konten utama |
| \`<footer>\` | Penutup: informasi hak cipta, kontak, tautan sekunder |

Struktur semantik yang baik terasa seperti daftar isi halaman. Pembaca layar dapat melompat antar-landmark; mesin pencari dapat memahami bagian mana yang utama.

~~~html title="struktur-halaman.html"
<body>
  <header>
    <a href="/">Beranda</a>
    <nav aria-label="Navigasi utama">
      <ul>
        <li><a href="/proyek">Proyek</a></li>
        <li><a href="/kontak">Kontak</a></li>
      </ul>
    </nav>
  </header>

  <main>
    <h1>Catatan Belajar</h1>
    <p>Saya menulis apa yang saya pelajari setiap minggu.</p>
    <article>
      <h2>Minggu pertama: struktur HTML</h2>
      <p>Hari ini saya menyusun halaman pertama dari nol.</p>
    </article>
  </main>

  <footer>
    <p>&copy; 2026 Rani Pratama</p>
  </footer>
</body>
~~~

Perhatikan bahwa setiap \`article\` memiliki judulnya sendiri. Aturan praktisnya: jika sebuah bagian punya judul dan bisa berdiri sendiri di luar konteks halaman, \`article\` adalah pilihan yang masuk akal.

## Aturan bersarang yang sering terlupakan

- Elemen tidak boleh saling bersilangan. \`<p><strong>teks</p></strong>\` salah; tutup elemen di dalam sebelum menutup elemen luar.
- \`<ul>\` dan \`<ol>\` hanya boleh berisi \`<li>\`. Teks bebas di antara \`<ul>\` dan \`<li>\` tidak valid.
- Hanya gunakan satu \`<h1>\` per halaman untuk judul utamanya. Gunakan \`<h2>\` dan seterusnya untuk subjudul.
- Jangan menggunakan heading untuk membuat teks terlihat besar. Ukuran diatur oleh CSS; heading menyatakan hierarki.

## Cara memeriksa pekerjaanmu

1. Buka halaman di browser dan tekan **View Source** atau *Inspect*. Bandingkan struktur yang kamu tulis dengan apa yang dibaca browser.
2. Gunakan validator HTML untuk memastikan tidak ada tag yang salah ditutup atau bersarang.
3. Coba navigasi halaman hanya dengan tombol **Tab**. Jika tautan tidak bisa dijangkau, ada masalah pada struktur atau CSS.

Pada latihan berikutnya kamu akan menyusun kerangka halaman profil. Tujuannya bukan membuat tampilan cantik, tetapi memastikan setiap bagian punya elemen yang tepat.`,
      code: {
        language: "html",
        filename: "index.html",
        caption: "Kerangka halaman dengan landmark semantik",
        code: `<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Profil Rani</title>
  </head>
  <body>
    <header>
      <p>Rani Pratama</p>
      <nav aria-label="Navigasi utama">
        <a href="#tentang">Tentang</a>
        <a href="#proyek">Proyek</a>
      </nav>
    </header>

    <main>
      <h1>Belajar membangun web, satu halaman setiap hari.</h1>
      <section id="tentang">
        <h2>Tentang</h2>
        <p>Saya sedang mempelajari HTML, CSS, dan JavaScript.</p>
      </section>
      <section id="proyek">
        <h2>Proyek</h2>
        <article>
          <h3>Halaman profil pertama</h3>
          <p>Halaman ini dibangun dari struktur semantik murni.</p>
        </article>
      </section>
    </main>

    <footer>
      <p>&copy; 2026 Rani Pratama</p>
    </footer>
  </body>
</html>`,
      },
      exercise: {
        title: "Susun kerangka halaman profil",
        brief:
          "Lengkapi kerangka halaman di editor. Fokus pada struktur semantik, bukan tampilan.",
        steps: [
          "Tambahkan <header> berisi nama kamu dan <nav> dengan dua tautan.",
          "Buat <main> dengan satu <h1>, dua <section>, dan satu <article>.",
          "Tambahkan <footer> berisi tahun dan nama kamu.",
          "Pastikan atribut lang pada <html> diisi \"id\".",
        ],
        hint: "Mulai dari landmark besar (header, main, footer), lalu isi bagian dalamnya. Setiap section sebaiknya memiliki heading sendiri.",
        starter: {
          html: `<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Profil Saya</title>
  </head>
  <body>
    <!-- TODO: buat <header> dengan nama dan <nav> berisi dua tautan -->

    <!-- TODO: buat <main> dengan <h1>, dua <section>, dan satu <article> -->

    <!-- TODO: buat <footer> berisi tahun dan namamu -->
  </body>
</html>`,
          css: `body {
  font-family: system-ui, sans-serif;
  line-height: 1.6;
  margin: 2rem auto;
  max-width: 40rem;
  padding: 0 1rem;
}

header {
  border-bottom: 1px solid #ddd;
  padding-bottom: 1rem;
}

nav a {
  margin-right: 0.75rem;
}`,
          js: "",
        },
      },
    },
    {
      slug: "html-teks-tautan-gambar",
      title: "Teks, tautan, dan gambar",
      summary:
        "Judul yang berjenjang, penekanan makna, tautan yang jelas, serta gambar dengan teks alternatif.",
      estimatedMinutes: 28,
      content: `Halaman yang baik dapat dibaca tanpa CSS. Itu artinya struktur teksnya harus benar sejak awal, sebelum kita memikirkan warna, ukuran, atau tata letak.

## Heading adalah kerangka, bukan hiasan

Gunakan \`<h1>\` untuk judul utama, \`<h2>\` untuk bagian besar, lalu \`<h3>\` untuk subbagian. Jangan melompat dari \`<h1>\` ke \`<h4>\` hanya karena ukuran \`<h4>\` terlihat lebih pas. Ukuran bisa diatur lewat CSS; hierarki heading diatur oleh struktur.

~~~html
<h1>Panduan menulis catatan</h1>
<h2>Menyiapkan alat</h2>
<h3>Memilih editor teks</h3>
<h2>Menulis setiap hari</h2>
~~~

Pembaca layar dapat menampilkan daftar heading sebagai daftar isi. Hierarki yang rapi membuat halaman mudah dinavigasi.

## Paragraf dan penekanan

- \`<p>\` untuk paragraf teks biasa.
- \`<strong>\` untuk kepentingan atau peringatan penting. Browser menampilkannya tebal, tetapi maknanya lebih dari sekadar tebal.
- \`<em>\` untuk penekanan yang mengubah arti kalimat.
- \`<blockquote>\` untuk kutipan panjang, dengan \`<cite>\` bila perlu menyebut sumber.
- \`<code>\` untuk potongan kode pendek di dalam teks.

Hindari \`<b>\` dan \`<i>\` untuk menyatakan makna. Gunakan \`<strong>\` dan \`<em>\` karena keduanya membawa informasi semantik.

## Tautan yang dapat dipahami

Tautan ditulis dengan \`<a href="...">\`. Teks tautan harus menjelaskan tujuan ketika dibaca di luar konteks:

~~~html
<!-- Kurang jelas ketika dibaca sendiri -->
<a href="/kursus/html">Klik di sini</a>

<!-- Lebih jelas -->
<a href="/kursus/html">Kursus HTML Fundamentals</a>
~~~

Jenis \`href\` yang umum:

- **Relatif**: \`/kursus/html\` menuju path pada domain yang sama.
- **Jangkar**: \`#tentang\` menuju elemen dengan \`id="tentang"\` di halaman yang sama.
- **Eksternal**: \`https://example.com\` menuju domain lain. Tambahkan \`rel="noopener noreferrer"\` bila memakai \`target="_blank"\`.

~~~html
<a href="#proyek">Lihat proyek</a>
<a href="https://developer.mozilla.org" target="_blank" rel="noopener noreferrer">
  Dokumentasi MDN
</a>
~~~

## Gambar dengan teks alternatif

Elemen gambar selalu memiliki atribut \`alt\`. Teks alternatif dipakai ketika gambar gagal dimuat, dibacakan pembaca layar, dan dibaca mesin pencari.

~~~html
<img
  src="/images/profil.jpg"
  alt="Rani berdiri di depan papan tulis berisi diagram HTML"
  width="480"
  height="320"
  loading="lazy"
/>
~~~

Aturan praktis \`alt\`:

- Jika gambar menyampaikan informasi, jelaskan isinya secara singkat.
- Jika gambar murni dekoratif, gunakan \`alt=""\` agar dilewati pembaca layar.
- Jangan mengawali dengan "Gambar dari..." karena pembaca layar sudah menyebutkan bahwa itu gambar.
- Sertakan \`width\` dan \`height\` agar browser memesan ruang dan tata letak tidak meloncat saat gambar selesai dimuat.

Untuk gambar yang memiliki keterangan, bungkus dengan \`<figure>\` dan tambahkan \`<figcaption>\`:

~~~html
<figure>
  <img src="/images/sketsa.jpg" alt="Sketsa tata letak halaman profil" />
  <figcaption>Rancangan tata letak sebelum menulis kode.</figcaption>
</figure>
~~~

## Daftar yang tepat

Gunakan \`<ul>\` bila urutan tidak penting dan \`<ol>\` bila urutan bermakna. Daftar deskripsi (\`<dl>\`, \`<dt>\`, \`<dd>\`) cocok untuk pasangan istilah dan definisi.

~~~html
<ul>
  <li>HTML untuk struktur</li>
  <li>CSS untuk tampilan</li>
  <li>JavaScript untuk interaksi</li>
</ul>

<dl>
  <dt>HTML</dt>
  <dd>Bahasa markup untuk menyusun konten halaman.</dd>
</dl>
~~~

## Latihan membaca kode

Perhatikan potongan berikut dan tanyakan: apakah heading-nya berjenjang? Apakah tautannya bisa dipahami tanpa konteks? Apakah \`alt\` gambar menjelaskan isinya?

~~~html
<article>
  <h2>Merawat tanaman di musim hujan</h2>
  <p>
    Tanaman perlu <strong>lebih sedikit air</strong> ketika udara lembap.
  </p>
  <figure>
    <img src="/images/tanaman.jpg" alt="Daun tanaman dengan tetesan air hujan" />
    <figcaption>Periksa kelembapan tanah sebelum menyiram.</figcaption>
  </figure>
  <p>
    Baca panduan lengkap di
    <a href="/panduan/musim-hujan">panduan merawat tanaman saat musim hujan</a>.
  </p>
</article>
~~~

Di latihan berikutnya, kamu akan menulis artikel pendek dengan tautan dan gambar yang aksesibel.`,
      code: {
        language: "html",
        filename: "artikel.html",
        caption: "Artikel dengan heading berjenjang, tautan, dan figure",
        code: `<article>
  <h2>Belajar dari proyek kecil</h2>
  <p>
    Proyek kecil membuat konsep sulit terasa <strong>nyata</strong>.
    Mulailah dari satu halaman, bukan satu aplikasi besar.
  </p>

  <h3>Langkah pertama</h3>
  <ol>
    <li>Tentukan satu tujuan yang sempit.</li>
    <li>Tulis struktur HTML sebelum menambah CSS.</li>
    <li>Periksa hasilnya di browser mobile.</li>
  </ol>

  <figure>
    <img
      src="https://placehold.co/640x360/eee/333?text=Pratinjau+halaman"
      alt="Pratinjau halaman profil sederhana dengan judul dan daftar proyek"
      width="640"
      height="360"
      loading="lazy"
    />
    <figcaption>Halaman pertama yang hanya memakai HTML.</figcaption>
  </figure>

  <p>
    Rujukan yang saya gunakan:
    <a href="https://developer.mozilla.org/id/docs/Web/HTML" target="_blank" rel="noopener noreferrer">
      dokumentasi HTML di MDN
    </a>.
  </p>
</article>`,
      },
      exercise: {
        title: "Tulis artikel dengan teks alternatif yang baik",
        brief:
          "Lengkapi artikel di editor. Perhatikan urutan heading, daftar, tautan, dan teks alternatif gambar.",
        steps: [
          "Gunakan satu <h2> sebagai judul artikel dan minimal satu <h3>.",
          "Tambahkan <ol> berisi tiga langkah belajar.",
          "Sisipkan <figure> dengan <img> dan <figcaption>. Isi alt dengan deskripsi isi gambar.",
          "Tambahkan satu tautan eksternal dengan rel=\"noopener noreferrer\".",
        ],
        hint: "Teks alt harus menjelaskan apa yang penting dari gambar. Jika gambar hanya hiasan, alt=\"\" adalah pilihan yang benar.",
        starter: {
          html: `<article>
  <!-- TODO: judul artikel dengan <h2> -->
  <!-- TODO: paragraf pembuka -->
  <!-- TODO: subjudul <h3> dan daftar <ol> berisi tiga langkah -->
  <!-- TODO: <figure> dengan <img src="https://placehold.co/640x360" alt="..." width="640" height="360"> dan <figcaption> -->
  <!-- TODO: paragraf dengan tautan eksternal -->
</article>`,
          css: `article {
  max-width: 42rem;
  margin: 2rem auto;
  padding: 0 1rem;
  font-family: system-ui, sans-serif;
  line-height: 1.65;
}

figure {
  margin: 1.5rem 0;
}

img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

figcaption {
  color: #555;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}`,
          js: "",
        },
      },
    },
    {
      slug: "html-formulir-aksesibilitas",
      title: "Formulir yang aksesibel",
      summary:
        "Label, tipe input, validasi bawaan, pengelompokan field, dan tombol yang berperilaku benar.",
      estimatedMinutes: 30,
      content: `Formulir adalah titik di mana pengguna memberikan data kepada aplikasi. Kesalahan kecil — label yang tidak terhubung, tombol tanpa tipe yang jelas — bisa membuat formulir tidak bisa digunakan dengan keyboard atau pembaca layar.

## Label wajib terhubung dengan input

Setiap input membutuhkan label. Hubungkan keduanya dengan \`for\` (pada label) dan \`id\` (pada input):

~~~html
<label for="email">Email</label>
<input id="email" name="email" type="email" autocomplete="email" required />
~~~

Mengklik label akan memfokuskan input. Pembaca layar akan membacakan nama field yang benar. Jangan hanya mengandalkan \`placeholder\`: ia hilang saat pengguna mulai mengetik dan tidak selalu dibacakan.

Jika label tidak memungkinkan secara visual, gunakan \`aria-label\` atau label tersembunyi. Namun label terlihat hampir selalu merupakan pilihan terbaik.

## Memilih tipe input yang tepat

\`type\` memberi tahu browser data apa yang diharapkan. Di ponsel, keyboard yang muncul menyesuaikan tipe input.

| Kebutuhan | Tipe input | Atribut tambahan |
| --- | --- | --- |
| Email | \`email\` | \`autocomplete="email"\` |
| Password | \`password\` | \`autocomplete="new-password"\` |
| Nomor telepon | \`tel\` | \`inputmode="tel"\` |
| Jumlah | \`number\` | \`min\`, \`max\`, \`step\` |
| Tanggal | \`date\` | \`min\`, \`max\` |
| Pilihan tunggal | \`radio\` | \`name\` sama untuk satu kelompok |
| Pilihan banyak | \`checkbox\` | \`name\` diakhiri \`[]\` pada server tertentu |

Atribut \`required\`, \`minlength\`, \`maxlength\`, dan \`pattern\` memberi validasi dasar tanpa JavaScript. Validasi di sisi klien berguna untuk pengalaman pengguna, tetapi **validasi tetap harus diulang di server** karena input bisa dimanipulasi.

## Kelompokkan pilihan dengan fieldset

Untuk sekelompok pilihan yang saling terkait, gunakan \`<fieldset>\` dan \`<legend>\`:

~~~html
<fieldset>
  <legend>Pengalaman belajar</legend>
  <label>
    <input type="radio" name="level" value="baru" checked />
    Baru mulai
  </label>
  <label>
    <input type="radio" name="level" value="pernah" />
    Sudah pernah belajar
  </label>
</fieldset>
~~~

Pembaca layar akan membacakan legenda sebelum setiap pilihan, sehingga konteksnya jelas.

## Tombol perlu tipe yang eksplisit

Di dalam form, tombol default memiliki \`type="submit"\`. Jika kamu punya tombol yang bukan untuk mengirim, tulis \`type="button"\` secara eksplisit agar tidak mengirim form secara tidak sengaja.

~~~html
<form action="/daftar" method="post">
  <label for="nama">Nama lengkap</label>
  <input id="nama" name="nama" type="text" autocomplete="name" required />

  <label for="email-daftar">Email</label>
  <input id="email-daftar" name="email" type="email" autocomplete="email" required />

  <button type="submit">Daftar</button>
</form>
~~~

## Pesan kesalahan yang dapat dipahami

Jangan hanya mengubah warna batas input ketika terjadi kesalahan. Berikan teks yang menjelaskan masalah dan hubungkan dengan \`aria-describedby\`:

~~~html
<label for="password-baru">Password baru</label>
<input
  id="password-baru"
  name="password"
  type="password"
  aria-describedby="password-bantuan password-error"
  aria-invalid="true"
  required
  minlength="8"
/>
<p id="password-bantuan">Minimal 8 karakter, gabungkan huruf dan angka.</p>
<p id="password-error" role="alert">Password perlu minimal 8 karakter.</p>
~~~

## Aksesibilitas bukan tambahan

- Jika seluruh formulir bisa diselesaikan hanya dengan keyboard, kamu sudah selangkah lebih maju.
- Pastikan urutan fokus masuk akal. Urutan elemen di HTML menentukan urutan Tab.
- Jangan menghapus gaya fokus tanpa menggantinya. Pengguna keyboard membutuhkan indikator fokus yang jelas.
- Hindari placeholder sebagai satu-satunya petunjuk.
- Untuk formulir panjang, gunakan \`autocomplete\` agar browser dapat mengisi data dengan benar.

Coba isi formulir di latihan berikut tanpa menggunakan mouse. Jika semua field bisa dijangkau dan tombol dapat ditekan dengan **Enter**, strukturmu sudah baik.`,
      code: {
        language: "html",
        filename: "form.html",
        caption: "Formulir pendaftaran dengan label, fieldset, dan validasi",
        code: `<form action="/daftar" method="post">
  <div>
    <label for="nama">Nama lengkap</label>
    <input id="nama" name="nama" type="text" autocomplete="name" required />
  </div>

  <div>
    <label for="email">Email</label>
    <input
      id="email"
      name="email"
      type="email"
      autocomplete="email"
      required
      placeholder="nama@email.com"
    />
  </div>

  <div>
    <label for="password">Password</label>
    <input
      id="password"
      name="password"
      type="password"
      autocomplete="new-password"
      minlength="8"
      aria-describedby="password-bantuan"
      required
    />
    <p id="password-bantuan">Minimal 8 karakter.</p>
  </div>

  <fieldset>
    <legend>Pengalaman belajar</legend>
    <label><input type="radio" name="level" value="baru" checked /> Baru mulai</label>
    <label><input type="radio" name="level" value="pernah" /> Sudah pernah belajar</label>
  </fieldset>

  <button type="submit">Buat akun</button>
</form>`,
      },
      exercise: {
        title: "Perbaiki formulir pendaftaran",
        brief:
          "Formulir di editor memiliki masalah aksesibilitas. Hubungkan label, tambahkan tipe input yang tepat, dan buat tombol yang benar.",
        steps: [
          "Setiap input harus memiliki label yang terhubung melalui for dan id.",
          "Gunakan type=\"email\" untuk email dan type=\"password\" untuk password.",
          "Tambahkan minlength=\"8\" pada password dan atribut required pada field wajib.",
          "Bungkus dua pilihan radio dalam <fieldset> dengan <legend>, dan pastikan keduanya memakai name yang sama.",
        ],
        hint: "Cek setiap label: apakah atribut for-nya sama dengan id input pasangannya? Pastikan tidak ada id ganda.",
        starter: {
          html: `<form action="/daftar" method="post">
  <p>Daftar akun LearnCode</p>

  <!-- TODO: perbaiki label dan input nama -->
  <label>Nama</label>
  <input name="nama" />

  <!-- TODO: perbaiki label, tipe, dan atribut email -->
  <label>Email</label>
  <input name="email" />

  <!-- TODO: password minimal 8 karakter -->
  <label>Password</label>
  <input name="password" />

  <!-- TODO: kelompokkan pilihan ini dengan fieldset dan legend -->
  <p>Pengalaman belajar</p>
  <label><input type="radio" name="level" value="baru" /> Baru mulai</label>
  <label><input type="radio" name="level-lain" value="pernah" /> Sudah pernah</label>

  <button>Daftar</button>
</form>`,
          css: `form {
  max-width: 26rem;
  margin: 2rem auto;
  font-family: system-ui, sans-serif;
}

form > * {
  display: block;
  margin-bottom: 1rem;
}

label {
  display: block;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

input:not([type="radio"]) {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #bbb;
  border-radius: 4px;
}

fieldset {
  border: 1px solid #ddd;
  padding: 0.75rem;
}

button {
  padding: 0.5rem 1rem;
}`,
          js: "",
        },
      },
    },
    {
      slug: "html-proyek-halaman-profil",
      title: "Proyek: halaman profil lengkap",
      summary:
        "Menggabungkan struktur, teks, tautan, gambar, dan formulir menjadi satu halaman yang utuh.",
      estimatedMinutes: 27,
      content: `Sekarang kita gabungkan semua yang sudah dipelajari. Proyek kecil ini terlihat sederhana, tetapi memuat hampir semua konsep penting HTML: landmark, hierarki heading, tautan, gambar dengan teks alternatif, daftar, dan formulir.

## Rencanakan sebelum menulis

Sebelum membuka editor, tuliskan bagian halaman dalam urutan yang masuk akal:

1. **Header** — nama, peran, dan navigasi jangkar.
2. **Main** — perkenalan singkat, daftar proyek, dan bagian kontak.
3. **Footer** — hak cipta dan tautan sosial.

Rencana ini menjadi kerangka. Setelah itu kita menerjemahkan setiap bagian menjadi elemen HTML yang tepat.

## Mulai dari landmark

~~~html title="profil.html"
<body>
  <header>
    <h1>Rani Pratama</h1>
    <p>Belajar membangun antarmuka web yang jelas dan aksesibel.</p>
    <nav aria-label="Bagian halaman">
      <a href="#proyek">Proyek</a>
      <a href="#kontak">Kontak</a>
    </nav>
  </header>

  <main>
    <section id="proyek" aria-labelledby="judul-proyek">
      <h2 id="judul-proyek">Proyek</h2>
      <!-- daftar proyek -->
    </section>

    <section id="kontak" aria-labelledby="judul-kontak">
      <h2 id="judul-kontak">Hubungi saya</h2>
      <!-- formulir -->
    </section>
  </main>

  <footer>
    <p>&copy; 2026 Rani Pratama</p>
  </footer>
</body>
~~~

Atribut \`aria-labelledby\` menghubungkan section dengan heading-nya. Ini memberi nama wilayah yang bermakna ketika pembaca layar menampilkan daftar landmark.

## Isi daftar proyek dengan article

Setiap proyek adalah konten yang berdiri sendiri. Gunakan \`<article>\` agar batasnya jelas:

~~~html
<ul>
  <li>
    <article>
      <h3>Halaman profil pertama</h3>
      <p>Struktur semantik tanpa CSS.</p>
      <a href="/proyek/profil">Lihat halaman</a>
    </article>
  </li>
  <li>
    <article>
      <h3>Formulir pendaftaran</h3>
      <p>Formulir yang bisa diselesaikan dengan keyboard.</p>
      <a href="/proyek/form">Lihat formulir</a>
    </article>
  </li>
</ul>
~~~

## Tambahkan formulir kontak

Formulir kontak minimal memiliki nama, email, pesan, dan tombol kirim. Ingat semua aturan dari lesson sebelumnya: label terhubung, tipe input tepat, tombol bertipe submit, dan validasi dasar.

~~~html
<form action="/kontak" method="post">
  <div>
    <label for="nama-kontak">Nama</label>
    <input id="nama-kontak" name="nama" type="text" autocomplete="name" required />
  </div>
  <div>
    <label for="email-kontak">Email</label>
    <input id="email-kontak" name="email" type="email" autocomplete="email" required />
  </div>
  <div>
    <label for="pesan">Pesan</label>
    <textarea id="pesan" name="pesan" rows="5" required></textarea>
  </div>
  <button type="submit">Kirim pesan</button>
</form>
~~~

## Periksa sebelum menyerahkan

Gunakan daftar periksa ini. Semua poin dapat diverifikasi tanpa melihat tampilan.

- Hanya ada satu \`<h1>\`, dan heading berikutnya berurutan.
- Setiap gambar memiliki \`alt\` yang sesuai konteks.
- Setiap tautan memiliki teks yang bermakna.
- Formulir memiliki label untuk setiap input.
- Tidak ada \`id\` ganda.
- Semua bagian utama berada di dalam \`<header>\`, \`<main>\`, atau \`<footer>\`.
- Halaman dapat dinavigasi dari awal sampai akhir dengan tombol Tab.

## Ketika ada yang tidak beres

Jika halaman terlihat berantakan, jangan langsung menambah CSS. Periksa HTML terlebih dahulu. Kesalahan bersarang seperti \`<p><div>...\` memaksa browser menebak struktur dan sering menghasilkan tata letak yang tidak terduga. Buka **Inspect** dan lihat pohon DOM: apakah strukturnya sama dengan yang kamu tulis?

Setelah proyek ini selesai, kamu siap masuk ke CSS. Struktur yang baik akan membuat pekerjaan styling jauh lebih mudah.`,
      code: {
        language: "html",
        filename: "profil.html",
        caption: "Halaman profil lengkap tanpa JavaScript",
        code: `<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Rani Pratama — Profil</title>
  </head>
  <body>
    <header>
      <h1>Rani Pratama</h1>
      <p>Belajar membangun antarmuka web yang jelas dan aksesibel.</p>
      <nav aria-label="Bagian halaman">
        <a href="#proyek">Proyek</a>
        <a href="#kontak">Kontak</a>
      </nav>
    </header>

    <main>
      <section id="proyek" aria-labelledby="judul-proyek">
        <h2 id="judul-proyek">Proyek</h2>
        <article>
          <h3>Halaman profil pertama</h3>
          <p>Struktur semantik murni tanpa CSS.</p>
        </article>
      </section>

      <section id="kontak" aria-labelledby="judul-kontak">
        <h2 id="judul-kontak">Hubungi saya</h2>
        <form action="/kontak" method="post">
          <p>
            <label for="nama-kontak">Nama</label>
            <input id="nama-kontak" name="nama" type="text" autocomplete="name" required />
          </p>
          <p>
            <label for="email-kontak">Email</label>
            <input id="email-kontak" name="email" type="email" autocomplete="email" required />
          </p>
          <p>
            <label for="pesan">Pesan</label>
            <textarea id="pesan" name="pesan" rows="5" required></textarea>
          </p>
          <button type="submit">Kirim pesan</button>
        </form>
      </section>
    </main>

    <footer>
      <p>&copy; 2026 Rani Pratama</p>
    </footer>
  </body>
</html>`,
      },
      exercise: {
        title: "Selesaikan halaman profil",
        brief:
          "Lengkapi halaman profil di editor. Struktur boleh sederhana, tetapi semua bagian harus valid dan dapat diakses.",
        steps: [
          "Lengkapi header dengan h1, deskripsi singkat, dan nav dua tautan jangkar.",
          "Buat dua section: Proyek dan Kontak. Setiap section memiliki heading h2.",
          "Di bagian Proyek, tambahkan minimal dua article dengan h3 dan tautan.",
          "Lengkapi formulir kontak: label terhubung, email bertipe email, pesan memakai textarea, tombol submit.",
          "Tambahkan footer dengan simbol &copy;.",
        ],
        hint: "Gunakan id yang unik untuk setiap input dan tautan jangkar. Uji navigasi dengan Tab setelah halaman dijalankan.",
        starter: {
          html: `<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Profil Saya</title>
  </head>
  <body>
    <header>
      <h1>Nama Kamu</h1>
      <p>Satu kalimat tentang apa yang sedang kamu pelajari.</p>
      <!-- TODO: nav dengan tautan ke #proyek dan #kontak -->
    </header>

    <main>
      <section id="proyek">
        <h2>Proyek</h2>
        <!-- TODO: dua article, masing-masing dengan h3 dan tautan -->
      </section>

      <section id="kontak">
        <h2>Kontak</h2>
        <!-- TODO: formulir kontak lengkap -->
      </section>
    </main>

    <!-- TODO: footer -->
  </body>
</html>`,
          css: `body {
  max-width: 44rem;
  margin: 0 auto;
  padding: 2rem 1rem;
  font-family: system-ui, sans-serif;
  line-height: 1.65;
  color: #222;
}

header {
  border-bottom: 1px solid #ddd;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
}

nav a {
  margin-right: 1rem;
}

article {
  border-left: 2px solid #1e4c3d;
  padding-left: 1rem;
  margin-bottom: 1rem;
}

label {
  display: block;
  font-size: 0.875rem;
  margin-top: 0.75rem;
}

input,
textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #bbb;
  border-radius: 4px;
  font: inherit;
}

button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
}`,
          js: "",
        },
      },
    },
  ],
  quiz: {
    title: "Quiz HTML Fundamentals",
    description:
      "Enam pertanyaan tentang struktur dokumen, elemen semantik, tautan, gambar, dan formulir. Nilai minimal 80% untuk melanjutkan ke sertifikat.",
    questions: [
      {
        id: "html-q1",
        prompt: "Apa fungsi dari <!DOCTYPE html> pada awal dokumen?",
        options: [
          { id: "a", text: "Menentukan warna latar halaman" },
          { id: "b", text: "Memberi tahu browser bahwa dokumen memakai HTML modern" },
          { id: "c", text: "Memuat stylesheet default browser" },
          { id: "d", text: "Mendefinisikan bahasa utama halaman" },
        ],
        correctOptionId: "b",
        explanation:
          "<!DOCTYPE html> adalah deklarasi tipe dokumen yang memicu standar mode pada browser. Bahasa utama diatur oleh atribut lang pada elemen html.",
      },
      {
        id: "html-q2",
        prompt:
          "Elemen mana yang paling tepat membungkus konten utama halaman, dan hanya boleh ada satu per halaman?",
        options: [
          { id: "a", text: "<section>" },
          { id: "b", text: "<article>" },
          { id: "c", text: "<main>" },
          { id: "d", text: "<div>" },
        ],
        correctOptionId: "c",
        explanation:
          "<main> menandai konten utama dokumen. Hanya boleh ada satu <main> yang terlihat per halaman, dan ia tidak boleh berada di dalam header, footer, atau nav.",
      },
      {
        id: "html-q3",
        prompt: "Mengapa setiap <img> sebaiknya memiliki atribut alt?",
        options: [
          { id: "a", text: "Agar gambar tampil lebih cepat" },
          { id: "b", text: "Untuk keperluan SEO saja" },
          {
            id: "c",
            text: "Agar isi gambar dapat dipahami ketika gambar gagal dimuat atau dibacakan pembaca layar",
          },
          { id: "d", text: "Karena HTML akan error tanpa alt" },
        ],
        correctOptionId: "c",
        explanation:
          "Teks alternatif menyampaikan makna gambar kepada pengguna pembaca layar dan menjadi fallback ketika gambar tidak dapat dimuat. Untuk gambar dekoratif, gunakan alt=\"\".",
      },
      {
        id: "html-q4",
        prompt: "Bagaimana cara yang benar menghubungkan label dengan input?",
        options: [
          { id: "a", text: "label for=\"email\" dan input id=\"email\"" },
          { id: "b", text: "label id=\"email\" dan input for=\"email\"" },
          { id: "c", text: "label name=\"email\" dan input id=\"email\"" },
          { id: "d", text: "Cukup menaruh placeholder=\"Email\" pada input" },
        ],
        correctOptionId: "a",
        explanation:
          "Atribut for pada <label> harus sama dengan id input. Dengan begitu, klik label memfokuskan input dan pembaca layar membacakan nama field yang tepat.",
      },
      {
        id: "html-q5",
        prompt: "Apa perbedaan <ol> dan <ul>?",
        options: [
          { id: "a", text: "<ol> untuk tautan, <ul> untuk teks" },
          { id: "b", text: "<ol> untuk urutan bermakna, <ul> untuk daftar tanpa urutan penting" },
          { id: "c", text: "Keduanya identik, hanya berbeda di CSS" },
          { id: "d", text: "<ul> hanya boleh berisi satu <li>" },
        ],
        correctOptionId: "b",
        explanation:
          "Pilihan daftar menyatakan makna. <ol> dipakai bila urutan langkah penting, misalnya tutorial; <ul> dipakai bila urutan tidak bermakna.",
      },
      {
        id: "html-q6",
        prompt:
          "Seorang pengguna hanya memakai keyboard. Apa yang harus dipastikan pada formulir?",
        options: [
          { id: "a", text: "Semua input memiliki placeholder" },
          {
            id: "b",
            text: "Urutan fokus masuk akal, setiap input berlabel, dan indikator fokus terlihat",
          },
          { id: "c", text: "Tombol dikirim otomatis saat halaman dibuka" },
          { id: "d", text: "Input disembunyikan sampai pengguna mengklik" },
        ],
        correctOptionId: "b",
        explanation:
          "Aksesibilitas keyboard bergantung pada urutan DOM yang logis, label yang terhubung, dan gaya fokus yang jelas. Placeholder bukan pengganti label.",
      },
    ],
  },
};
