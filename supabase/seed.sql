-- ============================================================================
-- LearnCode seed data — GENERATED FILE, do not edit by hand.
-- Source: src/content/*.ts   Regenerate: npm run seed:generate
-- Idempotent by deterministic IDs. Apply after the schema migration.
-- ============================================================================

-- Guard: fail with a readable message instead of a bare 42P01 when the
-- schema migrations have not been applied to this database yet.
do $lcguard$
begin
  if to_regclass('public.courses') is null
     or to_regclass('public.lessons') is null
     or to_regclass('public.quizzes') is null then
    raise exception using
      message = 'Skema LearnCode belum ada di database ini. Jalankan migration 20260101000000_learncode_schema.sql (dan migration admin sesudahnya) sebelum seed.sql.',
      hint = 'Supabase: SQL editor -> jalankan file migration sesuai urutan nama, lalu jalankan ulang seed ini.';
  end if;
end
$lcguard$;

-- Course: HTML Fundamentals
insert into public.courses (id, slug, title, tagline, description, level, duration_minutes, objectives, passing_score, status, position)
values (
  '7100a55e-4f6a-5bfb-8dcd-be5dbc3e610f',
  $lcseed$html-fundamentals$lcseed$,
  $lcseed$HTML Fundamentals$lcseed$,
  $lcseed$Bangun fondasi halaman web yang benar dan mudah diakses.$lcseed$,
  $lcseed$Mulai dari struktur dokumen, teks, tautan, gambar, hingga formulir yang aksesibel. Setiap lesson berisi contoh kode nyata dan latihan yang bisa langsung kamu jalankan di playground.$lcseed$,
  $lcseed$pemula$lcseed$,
  110,
  array[$lcseed$Menyusun dokumen HTML yang valid dengan struktur semantik yang jelas.$lcseed$, $lcseed$Menggunakan elemen teks, tautan, dan gambar secara tepat, termasuk atribut aksesibilitas.$lcseed$, $lcseed$Membangun formulir yang dapat digunakan dengan keyboard dan pembaca layar.$lcseed$, $lcseed$Membaca contoh kode HTML dan menjelaskan fungsi setiap bagiannya.$lcseed$]::text[],
  80,
  'published',
  1
)
on conflict (id) do update set
  slug = excluded.slug,
  title = excluded.title,
  tagline = excluded.tagline,
  description = excluded.description,
  level = excluded.level,
  duration_minutes = excluded.duration_minutes,
  objectives = excluded.objectives,
  passing_score = excluded.passing_score,
  status = excluded.status,
  position = excluded.position;

insert into public.lessons (id, course_id, slug, title, summary, content_md, code_example, exercise, position, estimated_minutes)
values (
  '616e8c2b-c5ef-5856-8d8d-291086cb0f2f',
  '7100a55e-4f6a-5bfb-8dcd-be5dbc3e610f',
  $lcseed$html-dokumen-dan-struktur$lcseed$,
  $lcseed$Dokumen HTML dan struktur semantik$lcseed$,
  $lcseed$Anatomi dokumen HTML, elemen dan atribut, serta elemen semantik yang memberi arti pada halaman.$lcseed$,
  $lcseed$HTML adalah bahasa yang memberi **struktur dan makna** pada konten halaman web. Browser membaca HTML, membentuk pohon elemen, lalu menampilkannya. Karena itu, HTML yang rapi bukan hanya soal tampilan — ia menentukan bagaimana halaman dipahami oleh browser, mesin pencari, dan teknologi bantu seperti pembaca layar.

## Elemen, tag, dan atribut

Sebuah *elemen* HTML biasanya terdiri dari tag pembuka, isi, dan tag penutup:

~~~html
<p class="intro">Belajar HTML itu praktis.</p>
~~~

- `<p>` adalah nama elemen.
- `class="intro"` adalah *atribut* yang memberi informasi tambahan.
- `Belajar HTML itu praktis.` adalah konten.

Beberapa elemen tidak memiliki isi, misalnya `<img>`, `<br>`, dan `<input>`. Elemen seperti ini disebut *void element* dan tidak perlu tag penutup.

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

1. `<!DOCTYPE html>` memberi tahu browser bahwa dokumen menggunakan HTML modern.
2. `<html lang="id">` adalah akar dokumen. Atribut `lang` membantu pembaca layar memilih pelafalan yang tepat.
3. `<head>` menyimpan metadata yang tidak terlihat langsung: encoding, viewport, judul tab, dan tautan ke CSS.
4. `<meta charset="UTF-8">` memastikan karakter seperti *é*, *—*, atau huruf non-Latin tampil benar.
5. `<meta name="viewport">` membuat halaman menyesuaikan lebar layar perangkat mobile.
6. `<body>` berisi semua konten yang terlihat oleh pengguna.

> Nama file utama biasanya `index.html`. Saat server menerima permintaan ke sebuah direktori, file inilah yang dikirim lebih dulu.

## Elemen semantik memberi arti

Dulu orang membungkus semuanya dengan `<div>`. Cara itu berhasil secara tampilan, tetapi tidak memberi informasi apa pun tentang isi. HTML modern menyediakan elemen semantik yang menjelaskan peran setiap bagian:

| Elemen | Peran |
| --- | --- |
| `<header>` | Bagian pembuka: judul situs, navigasi, identitas halaman |
| `<nav>` | Kumpulan tautan navigasi utama |
| `<main>` | Konten utama halaman; hanya boleh ada satu per halaman |
| `<section>` | Kelompok konten dengan tema yang sama |
| `<article>` | Konten yang berdiri sendiri, seperti postingan atau kartu produk |
| `<aside>` | Konten pendukung di samping konten utama |
| `<footer>` | Penutup: informasi hak cipta, kontak, tautan sekunder |

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

Perhatikan bahwa setiap `article` memiliki judulnya sendiri. Aturan praktisnya: jika sebuah bagian punya judul dan bisa berdiri sendiri di luar konteks halaman, `article` adalah pilihan yang masuk akal.

## Aturan bersarang yang sering terlupakan

- Elemen tidak boleh saling bersilangan. `<p><strong>teks</p></strong>` salah; tutup elemen di dalam sebelum menutup elemen luar.
- `<ul>` dan `<ol>` hanya boleh berisi `<li>`. Teks bebas di antara `<ul>` dan `<li>` tidak valid.
- Hanya gunakan satu `<h1>` per halaman untuk judul utamanya. Gunakan `<h2>` dan seterusnya untuk subjudul.
- Jangan menggunakan heading untuk membuat teks terlihat besar. Ukuran diatur oleh CSS; heading menyatakan hierarki.

## Cara memeriksa pekerjaanmu

1. Buka halaman di browser dan tekan **View Source** atau *Inspect*. Bandingkan struktur yang kamu tulis dengan apa yang dibaca browser.
2. Gunakan validator HTML untuk memastikan tidak ada tag yang salah ditutup atau bersarang.
3. Coba navigasi halaman hanya dengan tombol **Tab**. Jika tautan tidak bisa dijangkau, ada masalah pada struktur atau CSS.

Pada latihan berikutnya kamu akan menyusun kerangka halaman profil. Tujuannya bukan membuat tampilan cantik, tetapi memastikan setiap bagian punya elemen yang tepat.$lcseed$,
  $lcseed${"language":"html","filename":"index.html","caption":"Kerangka halaman dengan landmark semantik","code":"<!DOCTYPE html>\n<html lang=\"id\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>Profil Rani</title>\n  </head>\n  <body>\n    <header>\n      <p>Rani Pratama</p>\n      <nav aria-label=\"Navigasi utama\">\n        <a href=\"#tentang\">Tentang</a>\n        <a href=\"#proyek\">Proyek</a>\n      </nav>\n    </header>\n\n    <main>\n      <h1>Belajar membangun web, satu halaman setiap hari.</h1>\n      <section id=\"tentang\">\n        <h2>Tentang</h2>\n        <p>Saya sedang mempelajari HTML, CSS, dan JavaScript.</p>\n      </section>\n      <section id=\"proyek\">\n        <h2>Proyek</h2>\n        <article>\n          <h3>Halaman profil pertama</h3>\n          <p>Halaman ini dibangun dari struktur semantik murni.</p>\n        </article>\n      </section>\n    </main>\n\n    <footer>\n      <p>&copy; 2026 Rani Pratama</p>\n    </footer>\n  </body>\n</html>"}$lcseed$::jsonb,
  $lcseed${"title":"Susun kerangka halaman profil","brief":"Lengkapi kerangka halaman di editor. Fokus pada struktur semantik, bukan tampilan.","steps":["Tambahkan <header> berisi nama kamu dan <nav> dengan dua tautan.","Buat <main> dengan satu <h1>, dua <section>, dan satu <article>.","Tambahkan <footer> berisi tahun dan nama kamu.","Pastikan atribut lang pada <html> diisi \"id\"."],"hint":"Mulai dari landmark besar (header, main, footer), lalu isi bagian dalamnya. Setiap section sebaiknya memiliki heading sendiri.","starter":{"html":"<!DOCTYPE html>\n<html lang=\"id\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>Profil Saya</title>\n  </head>\n  <body>\n    <!-- TODO: buat <header> dengan nama dan <nav> berisi dua tautan -->\n\n    <!-- TODO: buat <main> dengan <h1>, dua <section>, dan satu <article> -->\n\n    <!-- TODO: buat <footer> berisi tahun dan namamu -->\n  </body>\n</html>","css":"body {\n  font-family: system-ui, sans-serif;\n  line-height: 1.6;\n  margin: 2rem auto;\n  max-width: 40rem;\n  padding: 0 1rem;\n}\n\nheader {\n  border-bottom: 1px solid #ddd;\n  padding-bottom: 1rem;\n}\n\nnav a {\n  margin-right: 0.75rem;\n}","js":""}}$lcseed$::jsonb,
  1,
  25
)
on conflict (id) do update set
  course_id = excluded.course_id,
  slug = excluded.slug,
  title = excluded.title,
  summary = excluded.summary,
  content_md = excluded.content_md,
  code_example = excluded.code_example,
  exercise = excluded.exercise,
  position = excluded.position,
  estimated_minutes = excluded.estimated_minutes;

insert into public.lessons (id, course_id, slug, title, summary, content_md, code_example, exercise, position, estimated_minutes)
values (
  '6eae9676-c705-5394-9e4c-a6709b4de9be',
  '7100a55e-4f6a-5bfb-8dcd-be5dbc3e610f',
  $lcseed$html-teks-tautan-gambar$lcseed$,
  $lcseed$Teks, tautan, dan gambar$lcseed$,
  $lcseed$Judul yang berjenjang, penekanan makna, tautan yang jelas, serta gambar dengan teks alternatif.$lcseed$,
  $lcseed$Halaman yang baik dapat dibaca tanpa CSS. Itu artinya struktur teksnya harus benar sejak awal, sebelum kita memikirkan warna, ukuran, atau tata letak.

## Heading adalah kerangka, bukan hiasan

Gunakan `<h1>` untuk judul utama, `<h2>` untuk bagian besar, lalu `<h3>` untuk subbagian. Jangan melompat dari `<h1>` ke `<h4>` hanya karena ukuran `<h4>` terlihat lebih pas. Ukuran bisa diatur lewat CSS; hierarki heading diatur oleh struktur.

~~~html
<h1>Panduan menulis catatan</h1>
<h2>Menyiapkan alat</h2>
<h3>Memilih editor teks</h3>
<h2>Menulis setiap hari</h2>
~~~

Pembaca layar dapat menampilkan daftar heading sebagai daftar isi. Hierarki yang rapi membuat halaman mudah dinavigasi.

## Paragraf dan penekanan

- `<p>` untuk paragraf teks biasa.
- `<strong>` untuk kepentingan atau peringatan penting. Browser menampilkannya tebal, tetapi maknanya lebih dari sekadar tebal.
- `<em>` untuk penekanan yang mengubah arti kalimat.
- `<blockquote>` untuk kutipan panjang, dengan `<cite>` bila perlu menyebut sumber.
- `<code>` untuk potongan kode pendek di dalam teks.

Hindari `<b>` dan `<i>` untuk menyatakan makna. Gunakan `<strong>` dan `<em>` karena keduanya membawa informasi semantik.

## Tautan yang dapat dipahami

Tautan ditulis dengan `<a href="...">`. Teks tautan harus menjelaskan tujuan ketika dibaca di luar konteks:

~~~html
<!-- Kurang jelas ketika dibaca sendiri -->
<a href="/kursus/html">Klik di sini</a>

<!-- Lebih jelas -->
<a href="/kursus/html">Kursus HTML Fundamentals</a>
~~~

Jenis `href` yang umum:

- **Relatif**: `/kursus/html` menuju path pada domain yang sama.
- **Jangkar**: `#tentang` menuju elemen dengan `id="tentang"` di halaman yang sama.
- **Eksternal**: `https://example.com` menuju domain lain. Tambahkan `rel="noopener noreferrer"` bila memakai `target="_blank"`.

~~~html
<a href="#proyek">Lihat proyek</a>
<a href="https://developer.mozilla.org" target="_blank" rel="noopener noreferrer">
  Dokumentasi MDN
</a>
~~~

## Gambar dengan teks alternatif

Elemen gambar selalu memiliki atribut `alt`. Teks alternatif dipakai ketika gambar gagal dimuat, dibacakan pembaca layar, dan dibaca mesin pencari.

~~~html
<img
  src="/images/profil.jpg"
  alt="Rani berdiri di depan papan tulis berisi diagram HTML"
  width="480"
  height="320"
  loading="lazy"
/>
~~~

Aturan praktis `alt`:

- Jika gambar menyampaikan informasi, jelaskan isinya secara singkat.
- Jika gambar murni dekoratif, gunakan `alt=""` agar dilewati pembaca layar.
- Jangan mengawali dengan "Gambar dari..." karena pembaca layar sudah menyebutkan bahwa itu gambar.
- Sertakan `width` dan `height` agar browser memesan ruang dan tata letak tidak meloncat saat gambar selesai dimuat.

Untuk gambar yang memiliki keterangan, bungkus dengan `<figure>` dan tambahkan `<figcaption>`:

~~~html
<figure>
  <img src="/images/sketsa.jpg" alt="Sketsa tata letak halaman profil" />
  <figcaption>Rancangan tata letak sebelum menulis kode.</figcaption>
</figure>
~~~

## Daftar yang tepat

Gunakan `<ul>` bila urutan tidak penting dan `<ol>` bila urutan bermakna. Daftar deskripsi (`<dl>`, `<dt>`, `<dd>`) cocok untuk pasangan istilah dan definisi.

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

Perhatikan potongan berikut dan tanyakan: apakah heading-nya berjenjang? Apakah tautannya bisa dipahami tanpa konteks? Apakah `alt` gambar menjelaskan isinya?

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

Di latihan berikutnya, kamu akan menulis artikel pendek dengan tautan dan gambar yang aksesibel.$lcseed$,
  $lcseed${"language":"html","filename":"artikel.html","caption":"Artikel dengan heading berjenjang, tautan, dan figure","code":"<article>\n  <h2>Belajar dari proyek kecil</h2>\n  <p>\n    Proyek kecil membuat konsep sulit terasa <strong>nyata</strong>.\n    Mulailah dari satu halaman, bukan satu aplikasi besar.\n  </p>\n\n  <h3>Langkah pertama</h3>\n  <ol>\n    <li>Tentukan satu tujuan yang sempit.</li>\n    <li>Tulis struktur HTML sebelum menambah CSS.</li>\n    <li>Periksa hasilnya di browser mobile.</li>\n  </ol>\n\n  <figure>\n    <img\n      src=\"https://placehold.co/640x360/eee/333?text=Pratinjau+halaman\"\n      alt=\"Pratinjau halaman profil sederhana dengan judul dan daftar proyek\"\n      width=\"640\"\n      height=\"360\"\n      loading=\"lazy\"\n    />\n    <figcaption>Halaman pertama yang hanya memakai HTML.</figcaption>\n  </figure>\n\n  <p>\n    Rujukan yang saya gunakan:\n    <a href=\"https://developer.mozilla.org/id/docs/Web/HTML\" target=\"_blank\" rel=\"noopener noreferrer\">\n      dokumentasi HTML di MDN\n    </a>.\n  </p>\n</article>"}$lcseed$::jsonb,
  $lcseed${"title":"Tulis artikel dengan teks alternatif yang baik","brief":"Lengkapi artikel di editor. Perhatikan urutan heading, daftar, tautan, dan teks alternatif gambar.","steps":["Gunakan satu <h2> sebagai judul artikel dan minimal satu <h3>.","Tambahkan <ol> berisi tiga langkah belajar.","Sisipkan <figure> dengan <img> dan <figcaption>. Isi alt dengan deskripsi isi gambar.","Tambahkan satu tautan eksternal dengan rel=\"noopener noreferrer\"."],"hint":"Teks alt harus menjelaskan apa yang penting dari gambar. Jika gambar hanya hiasan, alt=\"\" adalah pilihan yang benar.","starter":{"html":"<article>\n  <!-- TODO: judul artikel dengan <h2> -->\n  <!-- TODO: paragraf pembuka -->\n  <!-- TODO: subjudul <h3> dan daftar <ol> berisi tiga langkah -->\n  <!-- TODO: <figure> dengan <img src=\"https://placehold.co/640x360\" alt=\"...\" width=\"640\" height=\"360\"> dan <figcaption> -->\n  <!-- TODO: paragraf dengan tautan eksternal -->\n</article>","css":"article {\n  max-width: 42rem;\n  margin: 2rem auto;\n  padding: 0 1rem;\n  font-family: system-ui, sans-serif;\n  line-height: 1.65;\n}\n\nfigure {\n  margin: 1.5rem 0;\n}\n\nimg {\n  max-width: 100%;\n  height: auto;\n  border-radius: 4px;\n}\n\nfigcaption {\n  color: #555;\n  font-size: 0.875rem;\n  margin-top: 0.5rem;\n}","js":""}}$lcseed$::jsonb,
  2,
  28
)
on conflict (id) do update set
  course_id = excluded.course_id,
  slug = excluded.slug,
  title = excluded.title,
  summary = excluded.summary,
  content_md = excluded.content_md,
  code_example = excluded.code_example,
  exercise = excluded.exercise,
  position = excluded.position,
  estimated_minutes = excluded.estimated_minutes;

insert into public.lessons (id, course_id, slug, title, summary, content_md, code_example, exercise, position, estimated_minutes)
values (
  'd06375ce-d029-5e69-a102-18d76d8ef401',
  '7100a55e-4f6a-5bfb-8dcd-be5dbc3e610f',
  $lcseed$html-formulir-aksesibilitas$lcseed$,
  $lcseed$Formulir yang aksesibel$lcseed$,
  $lcseed$Label, tipe input, validasi bawaan, pengelompokan field, dan tombol yang berperilaku benar.$lcseed$,
  $lcseed$Formulir adalah titik di mana pengguna memberikan data kepada aplikasi. Kesalahan kecil — label yang tidak terhubung, tombol tanpa tipe yang jelas — bisa membuat formulir tidak bisa digunakan dengan keyboard atau pembaca layar.

## Label wajib terhubung dengan input

Setiap input membutuhkan label. Hubungkan keduanya dengan `for` (pada label) dan `id` (pada input):

~~~html
<label for="email">Email</label>
<input id="email" name="email" type="email" autocomplete="email" required />
~~~

Mengklik label akan memfokuskan input. Pembaca layar akan membacakan nama field yang benar. Jangan hanya mengandalkan `placeholder`: ia hilang saat pengguna mulai mengetik dan tidak selalu dibacakan.

Jika label tidak memungkinkan secara visual, gunakan `aria-label` atau label tersembunyi. Namun label terlihat hampir selalu merupakan pilihan terbaik.

## Memilih tipe input yang tepat

`type` memberi tahu browser data apa yang diharapkan. Di ponsel, keyboard yang muncul menyesuaikan tipe input.

| Kebutuhan | Tipe input | Atribut tambahan |
| --- | --- | --- |
| Email | `email` | `autocomplete="email"` |
| Password | `password` | `autocomplete="new-password"` |
| Nomor telepon | `tel` | `inputmode="tel"` |
| Jumlah | `number` | `min`, `max`, `step` |
| Tanggal | `date` | `min`, `max` |
| Pilihan tunggal | `radio` | `name` sama untuk satu kelompok |
| Pilihan banyak | `checkbox` | `name` diakhiri `[]` pada server tertentu |

Atribut `required`, `minlength`, `maxlength`, dan `pattern` memberi validasi dasar tanpa JavaScript. Validasi di sisi klien berguna untuk pengalaman pengguna, tetapi **validasi tetap harus diulang di server** karena input bisa dimanipulasi.

## Kelompokkan pilihan dengan fieldset

Untuk sekelompok pilihan yang saling terkait, gunakan `<fieldset>` dan `<legend>`:

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

Di dalam form, tombol default memiliki `type="submit"`. Jika kamu punya tombol yang bukan untuk mengirim, tulis `type="button"` secara eksplisit agar tidak mengirim form secara tidak sengaja.

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

Jangan hanya mengubah warna batas input ketika terjadi kesalahan. Berikan teks yang menjelaskan masalah dan hubungkan dengan `aria-describedby`:

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
- Untuk formulir panjang, gunakan `autocomplete` agar browser dapat mengisi data dengan benar.

Coba isi formulir di latihan berikut tanpa menggunakan mouse. Jika semua field bisa dijangkau dan tombol dapat ditekan dengan **Enter**, strukturmu sudah baik.$lcseed$,
  $lcseed${"language":"html","filename":"form.html","caption":"Formulir pendaftaran dengan label, fieldset, dan validasi","code":"<form action=\"/daftar\" method=\"post\">\n  <div>\n    <label for=\"nama\">Nama lengkap</label>\n    <input id=\"nama\" name=\"nama\" type=\"text\" autocomplete=\"name\" required />\n  </div>\n\n  <div>\n    <label for=\"email\">Email</label>\n    <input\n      id=\"email\"\n      name=\"email\"\n      type=\"email\"\n      autocomplete=\"email\"\n      required\n      placeholder=\"nama@email.com\"\n    />\n  </div>\n\n  <div>\n    <label for=\"password\">Password</label>\n    <input\n      id=\"password\"\n      name=\"password\"\n      type=\"password\"\n      autocomplete=\"new-password\"\n      minlength=\"8\"\n      aria-describedby=\"password-bantuan\"\n      required\n    />\n    <p id=\"password-bantuan\">Minimal 8 karakter.</p>\n  </div>\n\n  <fieldset>\n    <legend>Pengalaman belajar</legend>\n    <label><input type=\"radio\" name=\"level\" value=\"baru\" checked /> Baru mulai</label>\n    <label><input type=\"radio\" name=\"level\" value=\"pernah\" /> Sudah pernah belajar</label>\n  </fieldset>\n\n  <button type=\"submit\">Buat akun</button>\n</form>"}$lcseed$::jsonb,
  $lcseed${"title":"Perbaiki formulir pendaftaran","brief":"Formulir di editor memiliki masalah aksesibilitas. Hubungkan label, tambahkan tipe input yang tepat, dan buat tombol yang benar.","steps":["Setiap input harus memiliki label yang terhubung melalui for dan id.","Gunakan type=\"email\" untuk email dan type=\"password\" untuk password.","Tambahkan minlength=\"8\" pada password dan atribut required pada field wajib.","Bungkus dua pilihan radio dalam <fieldset> dengan <legend>, dan pastikan keduanya memakai name yang sama."],"hint":"Cek setiap label: apakah atribut for-nya sama dengan id input pasangannya? Pastikan tidak ada id ganda.","starter":{"html":"<form action=\"/daftar\" method=\"post\">\n  <p>Daftar akun LearnCode</p>\n\n  <!-- TODO: perbaiki label dan input nama -->\n  <label>Nama</label>\n  <input name=\"nama\" />\n\n  <!-- TODO: perbaiki label, tipe, dan atribut email -->\n  <label>Email</label>\n  <input name=\"email\" />\n\n  <!-- TODO: password minimal 8 karakter -->\n  <label>Password</label>\n  <input name=\"password\" />\n\n  <!-- TODO: kelompokkan pilihan ini dengan fieldset dan legend -->\n  <p>Pengalaman belajar</p>\n  <label><input type=\"radio\" name=\"level\" value=\"baru\" /> Baru mulai</label>\n  <label><input type=\"radio\" name=\"level-lain\" value=\"pernah\" /> Sudah pernah</label>\n\n  <button>Daftar</button>\n</form>","css":"form {\n  max-width: 26rem;\n  margin: 2rem auto;\n  font-family: system-ui, sans-serif;\n}\n\nform > * {\n  display: block;\n  margin-bottom: 1rem;\n}\n\nlabel {\n  display: block;\n  font-size: 0.875rem;\n  margin-bottom: 0.25rem;\n}\n\ninput:not([type=\"radio\"]) {\n  width: 100%;\n  padding: 0.5rem;\n  border: 1px solid #bbb;\n  border-radius: 4px;\n}\n\nfieldset {\n  border: 1px solid #ddd;\n  padding: 0.75rem;\n}\n\nbutton {\n  padding: 0.5rem 1rem;\n}","js":""}}$lcseed$::jsonb,
  3,
  30
)
on conflict (id) do update set
  course_id = excluded.course_id,
  slug = excluded.slug,
  title = excluded.title,
  summary = excluded.summary,
  content_md = excluded.content_md,
  code_example = excluded.code_example,
  exercise = excluded.exercise,
  position = excluded.position,
  estimated_minutes = excluded.estimated_minutes;

insert into public.lessons (id, course_id, slug, title, summary, content_md, code_example, exercise, position, estimated_minutes)
values (
  '8680c5f9-268b-5d15-b562-16b1e41778a8',
  '7100a55e-4f6a-5bfb-8dcd-be5dbc3e610f',
  $lcseed$html-proyek-halaman-profil$lcseed$,
  $lcseed$Proyek: halaman profil lengkap$lcseed$,
  $lcseed$Menggabungkan struktur, teks, tautan, gambar, dan formulir menjadi satu halaman yang utuh.$lcseed$,
  $lcseed$Sekarang kita gabungkan semua yang sudah dipelajari. Proyek kecil ini terlihat sederhana, tetapi memuat hampir semua konsep penting HTML: landmark, hierarki heading, tautan, gambar dengan teks alternatif, daftar, dan formulir.

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

Atribut `aria-labelledby` menghubungkan section dengan heading-nya. Ini memberi nama wilayah yang bermakna ketika pembaca layar menampilkan daftar landmark.

## Isi daftar proyek dengan article

Setiap proyek adalah konten yang berdiri sendiri. Gunakan `<article>` agar batasnya jelas:

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

- Hanya ada satu `<h1>`, dan heading berikutnya berurutan.
- Setiap gambar memiliki `alt` yang sesuai konteks.
- Setiap tautan memiliki teks yang bermakna.
- Formulir memiliki label untuk setiap input.
- Tidak ada `id` ganda.
- Semua bagian utama berada di dalam `<header>`, `<main>`, atau `<footer>`.
- Halaman dapat dinavigasi dari awal sampai akhir dengan tombol Tab.

## Ketika ada yang tidak beres

Jika halaman terlihat berantakan, jangan langsung menambah CSS. Periksa HTML terlebih dahulu. Kesalahan bersarang seperti `<p><div>...` memaksa browser menebak struktur dan sering menghasilkan tata letak yang tidak terduga. Buka **Inspect** dan lihat pohon DOM: apakah strukturnya sama dengan yang kamu tulis?

Setelah proyek ini selesai, kamu siap masuk ke CSS. Struktur yang baik akan membuat pekerjaan styling jauh lebih mudah.$lcseed$,
  $lcseed${"language":"html","filename":"profil.html","caption":"Halaman profil lengkap tanpa JavaScript","code":"<!DOCTYPE html>\n<html lang=\"id\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>Rani Pratama — Profil</title>\n  </head>\n  <body>\n    <header>\n      <h1>Rani Pratama</h1>\n      <p>Belajar membangun antarmuka web yang jelas dan aksesibel.</p>\n      <nav aria-label=\"Bagian halaman\">\n        <a href=\"#proyek\">Proyek</a>\n        <a href=\"#kontak\">Kontak</a>\n      </nav>\n    </header>\n\n    <main>\n      <section id=\"proyek\" aria-labelledby=\"judul-proyek\">\n        <h2 id=\"judul-proyek\">Proyek</h2>\n        <article>\n          <h3>Halaman profil pertama</h3>\n          <p>Struktur semantik murni tanpa CSS.</p>\n        </article>\n      </section>\n\n      <section id=\"kontak\" aria-labelledby=\"judul-kontak\">\n        <h2 id=\"judul-kontak\">Hubungi saya</h2>\n        <form action=\"/kontak\" method=\"post\">\n          <p>\n            <label for=\"nama-kontak\">Nama</label>\n            <input id=\"nama-kontak\" name=\"nama\" type=\"text\" autocomplete=\"name\" required />\n          </p>\n          <p>\n            <label for=\"email-kontak\">Email</label>\n            <input id=\"email-kontak\" name=\"email\" type=\"email\" autocomplete=\"email\" required />\n          </p>\n          <p>\n            <label for=\"pesan\">Pesan</label>\n            <textarea id=\"pesan\" name=\"pesan\" rows=\"5\" required></textarea>\n          </p>\n          <button type=\"submit\">Kirim pesan</button>\n        </form>\n      </section>\n    </main>\n\n    <footer>\n      <p>&copy; 2026 Rani Pratama</p>\n    </footer>\n  </body>\n</html>"}$lcseed$::jsonb,
  $lcseed${"title":"Selesaikan halaman profil","brief":"Lengkapi halaman profil di editor. Struktur boleh sederhana, tetapi semua bagian harus valid dan dapat diakses.","steps":["Lengkapi header dengan h1, deskripsi singkat, dan nav dua tautan jangkar.","Buat dua section: Proyek dan Kontak. Setiap section memiliki heading h2.","Di bagian Proyek, tambahkan minimal dua article dengan h3 dan tautan.","Lengkapi formulir kontak: label terhubung, email bertipe email, pesan memakai textarea, tombol submit.","Tambahkan footer dengan simbol &copy;."],"hint":"Gunakan id yang unik untuk setiap input dan tautan jangkar. Uji navigasi dengan Tab setelah halaman dijalankan.","starter":{"html":"<!DOCTYPE html>\n<html lang=\"id\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>Profil Saya</title>\n  </head>\n  <body>\n    <header>\n      <h1>Nama Kamu</h1>\n      <p>Satu kalimat tentang apa yang sedang kamu pelajari.</p>\n      <!-- TODO: nav dengan tautan ke #proyek dan #kontak -->\n    </header>\n\n    <main>\n      <section id=\"proyek\">\n        <h2>Proyek</h2>\n        <!-- TODO: dua article, masing-masing dengan h3 dan tautan -->\n      </section>\n\n      <section id=\"kontak\">\n        <h2>Kontak</h2>\n        <!-- TODO: formulir kontak lengkap -->\n      </section>\n    </main>\n\n    <!-- TODO: footer -->\n  </body>\n</html>","css":"body {\n  max-width: 44rem;\n  margin: 0 auto;\n  padding: 2rem 1rem;\n  font-family: system-ui, sans-serif;\n  line-height: 1.65;\n  color: #222;\n}\n\nheader {\n  border-bottom: 1px solid #ddd;\n  margin-bottom: 2rem;\n  padding-bottom: 1rem;\n}\n\nnav a {\n  margin-right: 1rem;\n}\n\narticle {\n  border-left: 2px solid #1e4c3d;\n  padding-left: 1rem;\n  margin-bottom: 1rem;\n}\n\nlabel {\n  display: block;\n  font-size: 0.875rem;\n  margin-top: 0.75rem;\n}\n\ninput,\ntextarea {\n  width: 100%;\n  padding: 0.5rem;\n  border: 1px solid #bbb;\n  border-radius: 4px;\n  font: inherit;\n}\n\nbutton {\n  margin-top: 1rem;\n  padding: 0.5rem 1rem;\n}","js":""}}$lcseed$::jsonb,
  4,
  27
)
on conflict (id) do update set
  course_id = excluded.course_id,
  slug = excluded.slug,
  title = excluded.title,
  summary = excluded.summary,
  content_md = excluded.content_md,
  code_example = excluded.code_example,
  exercise = excluded.exercise,
  position = excluded.position,
  estimated_minutes = excluded.estimated_minutes;

insert into public.quizzes (id, course_id, title, description, passing_score)
values (
  '8b4ec96f-c54c-5d27-9c8e-4e4a299861ae',
  '7100a55e-4f6a-5bfb-8dcd-be5dbc3e610f',
  $lcseed$Quiz HTML Fundamentals$lcseed$,
  $lcseed$Enam pertanyaan tentang struktur dokumen, elemen semantik, tautan, gambar, dan formulir. Nilai minimal 80% untuk melanjutkan ke sertifikat.$lcseed$,
  80
)
on conflict (id) do update set
  course_id = excluded.course_id,
  title = excluded.title,
  description = excluded.description,
  passing_score = excluded.passing_score;

insert into public.quiz_questions (id, quiz_id, prompt, code, code_language, options, correct_option_id, explanation, position)
values (
  '89bfe327-0ddc-5774-977e-12737a724963',
  '8b4ec96f-c54c-5d27-9c8e-4e4a299861ae',
  $lcseed$Apa fungsi dari <!DOCTYPE html> pada awal dokumen?$lcseed$,
  null,
  null,
  $lcseed$[{"id":"a","text":"Menentukan warna latar halaman"},{"id":"b","text":"Memberi tahu browser bahwa dokumen memakai HTML modern"},{"id":"c","text":"Memuat stylesheet default browser"},{"id":"d","text":"Mendefinisikan bahasa utama halaman"}]$lcseed$::jsonb,
  $lcseed$b$lcseed$,
  $lcseed$<!DOCTYPE html> adalah deklarasi tipe dokumen yang memicu standar mode pada browser. Bahasa utama diatur oleh atribut lang pada elemen html.$lcseed$,
  1
)
on conflict (id) do update set
  quiz_id = excluded.quiz_id,
  prompt = excluded.prompt,
  code = excluded.code,
  code_language = excluded.code_language,
  options = excluded.options,
  correct_option_id = excluded.correct_option_id,
  explanation = excluded.explanation,
  position = excluded.position;

insert into public.quiz_questions (id, quiz_id, prompt, code, code_language, options, correct_option_id, explanation, position)
values (
  'dae5380f-dc61-54a3-84d3-a15ad4dbc3af',
  '8b4ec96f-c54c-5d27-9c8e-4e4a299861ae',
  $lcseed$Elemen mana yang paling tepat membungkus konten utama halaman, dan hanya boleh ada satu per halaman?$lcseed$,
  null,
  null,
  $lcseed$[{"id":"a","text":"<section>"},{"id":"b","text":"<article>"},{"id":"c","text":"<main>"},{"id":"d","text":"<div>"}]$lcseed$::jsonb,
  $lcseed$c$lcseed$,
  $lcseed$<main> menandai konten utama dokumen. Hanya boleh ada satu <main> yang terlihat per halaman, dan ia tidak boleh berada di dalam header, footer, atau nav.$lcseed$,
  2
)
on conflict (id) do update set
  quiz_id = excluded.quiz_id,
  prompt = excluded.prompt,
  code = excluded.code,
  code_language = excluded.code_language,
  options = excluded.options,
  correct_option_id = excluded.correct_option_id,
  explanation = excluded.explanation,
  position = excluded.position;

insert into public.quiz_questions (id, quiz_id, prompt, code, code_language, options, correct_option_id, explanation, position)
values (
  '0326b2b5-cfbf-5de3-8420-8efb08989769',
  '8b4ec96f-c54c-5d27-9c8e-4e4a299861ae',
  $lcseed$Mengapa setiap <img> sebaiknya memiliki atribut alt?$lcseed$,
  null,
  null,
  $lcseed$[{"id":"a","text":"Agar gambar tampil lebih cepat"},{"id":"b","text":"Untuk keperluan SEO saja"},{"id":"c","text":"Agar isi gambar dapat dipahami ketika gambar gagal dimuat atau dibacakan pembaca layar"},{"id":"d","text":"Karena HTML akan error tanpa alt"}]$lcseed$::jsonb,
  $lcseed$c$lcseed$,
  $lcseed$Teks alternatif menyampaikan makna gambar kepada pengguna pembaca layar dan menjadi fallback ketika gambar tidak dapat dimuat. Untuk gambar dekoratif, gunakan alt="".$lcseed$,
  3
)
on conflict (id) do update set
  quiz_id = excluded.quiz_id,
  prompt = excluded.prompt,
  code = excluded.code,
  code_language = excluded.code_language,
  options = excluded.options,
  correct_option_id = excluded.correct_option_id,
  explanation = excluded.explanation,
  position = excluded.position;

insert into public.quiz_questions (id, quiz_id, prompt, code, code_language, options, correct_option_id, explanation, position)
values (
  'e7c7eb0b-c5f3-525f-b647-a5e43a467222',
  '8b4ec96f-c54c-5d27-9c8e-4e4a299861ae',
  $lcseed$Bagaimana cara yang benar menghubungkan label dengan input?$lcseed$,
  null,
  null,
  $lcseed$[{"id":"a","text":"label for=\"email\" dan input id=\"email\""},{"id":"b","text":"label id=\"email\" dan input for=\"email\""},{"id":"c","text":"label name=\"email\" dan input id=\"email\""},{"id":"d","text":"Cukup menaruh placeholder=\"Email\" pada input"}]$lcseed$::jsonb,
  $lcseed$a$lcseed$,
  $lcseed$Atribut for pada <label> harus sama dengan id input. Dengan begitu, klik label memfokuskan input dan pembaca layar membacakan nama field yang tepat.$lcseed$,
  4
)
on conflict (id) do update set
  quiz_id = excluded.quiz_id,
  prompt = excluded.prompt,
  code = excluded.code,
  code_language = excluded.code_language,
  options = excluded.options,
  correct_option_id = excluded.correct_option_id,
  explanation = excluded.explanation,
  position = excluded.position;

insert into public.quiz_questions (id, quiz_id, prompt, code, code_language, options, correct_option_id, explanation, position)
values (
  'b19a9a68-1db8-59be-a9a5-5dd1039a6770',
  '8b4ec96f-c54c-5d27-9c8e-4e4a299861ae',
  $lcseed$Apa perbedaan <ol> dan <ul>?$lcseed$,
  null,
  null,
  $lcseed$[{"id":"a","text":"<ol> untuk tautan, <ul> untuk teks"},{"id":"b","text":"<ol> untuk urutan bermakna, <ul> untuk daftar tanpa urutan penting"},{"id":"c","text":"Keduanya identik, hanya berbeda di CSS"},{"id":"d","text":"<ul> hanya boleh berisi satu <li>"}]$lcseed$::jsonb,
  $lcseed$b$lcseed$,
  $lcseed$Pilihan daftar menyatakan makna. <ol> dipakai bila urutan langkah penting, misalnya tutorial; <ul> dipakai bila urutan tidak bermakna.$lcseed$,
  5
)
on conflict (id) do update set
  quiz_id = excluded.quiz_id,
  prompt = excluded.prompt,
  code = excluded.code,
  code_language = excluded.code_language,
  options = excluded.options,
  correct_option_id = excluded.correct_option_id,
  explanation = excluded.explanation,
  position = excluded.position;

insert into public.quiz_questions (id, quiz_id, prompt, code, code_language, options, correct_option_id, explanation, position)
values (
  'a340c258-5bf8-5c91-a787-a0409362ba3a',
  '8b4ec96f-c54c-5d27-9c8e-4e4a299861ae',
  $lcseed$Seorang pengguna hanya memakai keyboard. Apa yang harus dipastikan pada formulir?$lcseed$,
  null,
  null,
  $lcseed$[{"id":"a","text":"Semua input memiliki placeholder"},{"id":"b","text":"Urutan fokus masuk akal, setiap input berlabel, dan indikator fokus terlihat"},{"id":"c","text":"Tombol dikirim otomatis saat halaman dibuka"},{"id":"d","text":"Input disembunyikan sampai pengguna mengklik"}]$lcseed$::jsonb,
  $lcseed$b$lcseed$,
  $lcseed$Aksesibilitas keyboard bergantung pada urutan DOM yang logis, label yang terhubung, dan gaya fokus yang jelas. Placeholder bukan pengganti label.$lcseed$,
  6
)
on conflict (id) do update set
  quiz_id = excluded.quiz_id,
  prompt = excluded.prompt,
  code = excluded.code,
  code_language = excluded.code_language,
  options = excluded.options,
  correct_option_id = excluded.correct_option_id,
  explanation = excluded.explanation,
  position = excluded.position;

-- Course: CSS Fundamentals
insert into public.courses (id, slug, title, tagline, description, level, duration_minutes, objectives, passing_score, status, position)
values (
  'b61032fa-9477-5175-865b-bd023acf397f',
  $lcseed$css-fundamentals$lcseed$,
  $lcseed$CSS Fundamentals$lcseed$,
  $lcseed$Atur tampilan dengan sistem, bukan tebakan.$lcseed$,
  $lcseed$Pelajari cascade, box model, tipografi, Flexbox, Grid, dan desain responsif. Fokus pada alasan di balik setiap properti sehingga kamu bisa memperbaiki tata letak sendiri, bukan sekadar menyalin kode.$lcseed$,
  $lcseed$pemula$lcseed$,
  140,
  array[$lcseed$Menjelaskan cara kerja cascade, inheritance, dan specificity.$lcseed$, $lcseed$Menghitung ukuran elemen dengan box model dan mengatur ruang secara konsisten.$lcseed$, $lcseed$Membangun tata letak satu dimensi dengan Flexbox dan dua dimensi dengan Grid.$lcseed$, $lcseed$Membuat antarmuka responsif, aksesibel, dan mendukung preferensi tema pengguna.$lcseed$]::text[],
  80,
  'published',
  2
)
on conflict (id) do update set
  slug = excluded.slug,
  title = excluded.title,
  tagline = excluded.tagline,
  description = excluded.description,
  level = excluded.level,
  duration_minutes = excluded.duration_minutes,
  objectives = excluded.objectives,
  passing_score = excluded.passing_score,
  status = excluded.status,
  position = excluded.position;

insert into public.lessons (id, course_id, slug, title, summary, content_md, code_example, exercise, position, estimated_minutes)
values (
  '60e68dc2-ff90-5ee2-a319-d604917f98da',
  'b61032fa-9477-5175-865b-bd023acf397f',
  $lcseed$css-selektor-cascade$lcseed$,
  $lcseed$Selektor, cascade, dan specificity$lcseed$,
  $lcseed$Bagaimana CSS memilih elemen, mengapa satu aturan menang atas aturan lain, dan cara menulis selektor yang tahan lama.$lcseed$,
  $lcseed$CSS bekerja dengan dua langkah: **memilih** elemen, lalu **menerapkan** deklarasi. Ketika beberapa deklarasi menargetkan properti yang sama, browser menyelesaikannya lewat *cascade*. Memahami cascade membuat kamu berhenti menebak-nebak mengapa sebuah gaya "tidak mau berubah".

## Anatomi aturan CSS

~~~css
/* selector { property: value; } */
.card-title {
  color: #1e4c3d;
  font-size: 1.25rem;
}
~~~

- **Selector** menentukan elemen mana yang terkena aturan.
- **Property** adalah aspek yang diatur, misalnya `color`.
- **Value** adalah nilainya.

## Jenis selektor yang paling sering dipakai

| Selektor | Contoh | Memilih |
| --- | --- | --- |
| Tipe | `p` | Semua elemen `<p>` |
| Kelas | `.intro` | Elemen dengan `class="intro"` |
| ID | `#kontak` | Elemen dengan `id="kontak"` |
| Atribut | `[type="email"]` | Elemen dengan atribut tersebut |
| Keturunan | `.card p` | Semua `p` di dalam `.card` |
| Anak langsung | `.card > p` | `p` yang merupakan anak langsung `.card` |
| Pseudo-class | `a:hover` | Tautan saat kursor berada di atasnya |
| Pseudo-element | `.card::before` | Bagian semu sebelum isi elemen |

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

Paragraf dengan `class="intro"` akan berwarna hijau. Urutan keputusan cascade secara ringkas:

1. **Origin dan importance** — gaya dari browser, penulis, dan `!important` diurutkan dengan aturan khusus.
2. **Specificity** — selektor yang lebih spesifik menang.
3. **Urutan kemunculan** — jika semua sama, aturan yang ditulis belakangan menang.

Gunakan `!important` hanya ketika benar-benar perlu menimpa gaya pihak ketiga. Jika kamu sering membutuhkannya, biasanya ada masalah struktur CSS.

## Specificity dalam angka

Specificity dihitung dari tiga komponen:

- **ID** — bobot paling tinggi.
- **Kelas, atribut, pseudo-class** — bobot menengah.
- **Elemen dan pseudo-element** — bobot rendah.

Contoh:

- `#kontak .card a` → 1 ID + 1 kelas + 1 elemen.
- `.card a` → 1 kelas + 1 elemen.

Aturan pertama menang meskipun ditulis lebih dulu, karena memiliki ID. Sebaliknya, **inline style** (`style="..."`) mengalahkan selektor mana pun di stylesheet biasa.

Cara menjaga specificity tetap sehat:

- Utamakan kelas, hindari ID untuk styling.
- Hindari selektor bertingkat terlalu dalam seperti `.page .layout .card .card-body p`.
- Lebih baik memberi kelas pada elemen yang ingin diatur.

## Inheritance

Beberapa properti diwariskan otomatis dari elemen induk ke anak, terutama yang berkaitan dengan teks: `color`, `font-family`, `font-size`, dan `line-height`. Properti tata letak seperti `margin`, `border`, dan `display` tidak diwariskan.

~~~css
body {
  font-family: system-ui, sans-serif;
  color: #26251f;
}

/* Semua elemen di dalam body mewarisi font dan warna di atas,
   kecuali jika ada aturan yang menimpanya. */
~~~

Properti `inherit`, `initial`, `unset`, dan `revert` memungkinkan kontrol eksplisit. Misalnya, tombol pada beberapa browser memakai font sistem sendiri; `button { font: inherit; }` menyamakannya dengan teks di sekitarnya.

## Saturasi dan keterbacaan

Menulis warna langsung (`#1e4c3d`) bisa merepotkan ketika tema berubah. Custom property memusatkan nilai di satu tempat:

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
3. Apakah properti tersebut diwariskan atau dihitung ulang (misalnya `width` pada elemen inline)?
4. Apakah ada typo pada nama properti?

Di latihan berikutnya kamu akan memperbaiki aturan yang konflik dan menata ulang selektor agar mudah diprediksi.$lcseed$,
  $lcseed${"language":"css","filename":"cascade.css","caption":"Cascade, specificity, dan custom property","code":":root {\n  --ink: #26251f;\n  --muted: #6a675e;\n  --paper: #faf9f5;\n  --accent: #1e4c3d;\n}\n\n* {\n  box-sizing: border-box;\n}\n\nbody {\n  margin: 0;\n  padding: 2rem 1rem;\n  background: var(--paper);\n  color: var(--ink);\n  font-family: system-ui, sans-serif;\n  line-height: 1.6;\n}\n\na {\n  color: var(--accent);\n}\n\na:hover,\na:focus-visible {\n  text-decoration-thickness: 2px;\n}\n\n.note {\n  color: var(--muted);\n}\n\n/* Kelas ini menang atas selektor tipe di atasnya. */\n.note.important {\n  color: var(--accent);\n  font-weight: 600;\n}"}$lcseed$::jsonb,
  $lcseed${"title":"Selesaikan konflik cascade","brief":"Dua aturan berebut elemen yang sama. Ubah hanya selektornya agar judul memakai warna aksen dan catatan tetap redup.","steps":["Amati hasil di preview: judul dan catatan saat ini berwarna kelabu.","Buat aturan yang menargetkan .judul dengan warna #1e4c3d.","Pastikan .catatan tetap memakai warna #6a675e.","Jangan gunakan !important atau inline style."],"hint":"Cascade memilih selektor yang lebih spesifik. Kelas .judul memiliki bobot lebih tinggi daripada selektor tipe h1.","starter":{"html":"<body>\n  <h1 class=\"judul\">Cascade itu bisa diprediksi</h1>\n  <p class=\"catatan\">Catatan ini harus tetap berwarna redup.</p>\n  <p class=\"catatan penting\">Catatan ini ditekankan tanpa mengubah warna catatan lain.</p>\n</body>","css":"body {\n  font-family: system-ui, sans-serif;\n  padding: 2rem;\n  background: #faf9f5;\n  color: #26251f;\n  line-height: 1.6;\n}\n\nh1,\np {\n  color: #6a675e;\n}\n\n/* TODO: beri .judul warna #1e4c3d tanpa !important */\n\n/* TODO: buat .catatan.penting lebih tebal, warna tetap #6a675e */\n","js":""}}$lcseed$::jsonb,
  1,
  30
)
on conflict (id) do update set
  course_id = excluded.course_id,
  slug = excluded.slug,
  title = excluded.title,
  summary = excluded.summary,
  content_md = excluded.content_md,
  code_example = excluded.code_example,
  exercise = excluded.exercise,
  position = excluded.position,
  estimated_minutes = excluded.estimated_minutes;

insert into public.lessons (id, course_id, slug, title, summary, content_md, code_example, exercise, position, estimated_minutes)
values (
  '324886f3-8742-5027-8784-8a001c351b27',
  'b61032fa-9477-5175-865b-bd023acf397f',
  $lcseed$css-box-model-tipografi$lcseed$,
  $lcseed$Box model, tipografi, dan spacing$lcseed$,
  $lcseed$Setiap elemen adalah kotak. Pahami padding, border, margin, ukuran, dan ritme vertikal yang konsisten.$lcseed$,
  $lcseed$Setiap elemen HTML dirender sebagai kotak. Ketika tata letak terasa "tidak pas", penyebabnya hampir selalu box model: ukuran, padding, border, atau margin yang tidak diperhitungkan.

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

Secara default, `width` hanya menghitung area konten. Jika kamu menambahkan padding dan border, lebar total bertambah:

- `width: 320px` + padding 20px kiri-kanan + border 1px kiri-kanan = **362px**.

Itu sering mengejutkan. Solusi standar adalah mengubah cara perhitungan:

~~~css
*,
*::before,
*::after {
  box-sizing: border-box;
}
~~~

Dengan `border-box`, `width: 320px` berarti lebar total termasuk padding dan border. Hampir semua proyek modern memakai aturan ini.

## Ukuran yang fleksibel

- `max-width` lebih aman daripada `width` tetap untuk konten teks.
- `min-height` berguna untuk area yang harus tetap terlihat meskipun isinya sedikit.
- Hindari tinggi tetap untuk blok teks karena isi bisa bertambah, terutama dalam bahasa lain atau saat ukuran font diperbesar.

~~~css
.prose {
  width: 100%;
  max-width: 68ch;
  margin-inline: auto;
}
~~~

Satuan `ch` mengacu pada lebar karakter "0". Lebar 60–75ch umumnya nyaman dibaca.

## Unit: kapan memakai apa

| Unit | Cocok untuk |
| --- | --- |
| `px` | Border, garis tipis, ukuran yang harus presisi |
| `rem` | Font size, spacing global; mengikuti preferensi ukuran font pengguna |
| `em` | Padding yang menyesuaikan ukuran font komponen |
| `%` | Lebar relatif terhadap induk |
| `ch` | Lebar baris teks |
| `dvh`/`svh` | Tinggi viewport pada perangkat mobile |

Aturan praktis: gunakan `rem` untuk hampir semua spacing dan ukuran font. `px` tetap wajar untuk border 1px.

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

- Teks paragraf: `line-height` sekitar `1.6` sampai `1.75`.
- Judul besar: `1.05` sampai `1.2` agar baris terasa padat dan tegas.
- Gunakan `text-wrap: balance` pada judul pendek untuk menghindari satu kata menggantung.

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

Margin tidak runtuh pada elemen flex atau grid. Jika jarak terasa tidak sesuai, gunakan `gap` pada container daripada margin pada anak.

## Tidak semua elemen menghormati width

Elemen inline seperti `<a>` dan `<span>` mengabaikan `width` dan `height`. Untuk memberi ukuran, ubah `display`-nya:

~~~css
.tombol {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
}
~~~

## Latihan: menghitung kotak

Sebuah kartu memakai `box-sizing: border-box`, `width: 320px`, `padding: 24px`, dan `border: 1px solid`. Berapa lebar area kontennya?

Dengan `border-box`, lebar total tetap 320px. Area konten = 320 − (24 × 2) − (1 × 2) = **270px**. Latihan berikutnya akan membuat kamu mempraktikkan perhitungan ini lewat CSS nyata.$lcseed$,
  $lcseed${"language":"css","filename":"kartu.css","caption":"Kartu dengan box-sizing, skala spacing, dan tipografi","code":":root {\n  --paper: #faf9f5;\n  --surface: #ffffff;\n  --ink: #26251f;\n  --muted: #6a675e;\n  --line: #e3dfd4;\n  --space-2: 0.5rem;\n  --space-4: 1rem;\n  --space-6: 1.5rem;\n}\n\n*,\n*::before,\n*::after {\n  box-sizing: border-box;\n}\n\nbody {\n  margin: 0;\n  padding: var(--space-6);\n  background: var(--paper);\n  color: var(--ink);\n  font-family: system-ui, sans-serif;\n  line-height: 1.65;\n}\n\n.card {\n  width: 100%;\n  max-width: 22rem;\n  padding: var(--space-6);\n  border: 1px solid var(--line);\n  border-radius: 8px;\n  background: var(--surface);\n}\n\n.card h2 {\n  margin: 0 0 var(--space-2);\n  font-size: 1.375rem;\n  line-height: 1.2;\n}\n\n.card p {\n  margin: 0;\n  color: var(--muted);\n  font-size: 0.9375rem;\n}"}$lcseed$::jsonb,
  $lcseed${"title":"Perbaiki kartu yang melebar","brief":"Kartu di editor keluar dari batas container karena box model. Perbaiki tanpa mengubah nilai width yang sudah ada.","steps":["Tambahkan box-sizing: border-box pada semua elemen termasuk pseudo-element.","Beri body max-width 24rem dan margin-inline auto agar kartu terpusat.","Atur padding kartu 1.5rem dan margin judul bawah 0.5rem.","Pastikan teks paragraf memakai warna #6a675e."],"hint":"Lebar 100% + padding 24px akan melebihi container jika box-sizing masih content-box.","starter":{"html":"<body>\n  <div class=\"kartu\">\n    <h2>Belajar CSS</h2>\n    <p>\n      Kotak ini harus muat di dalam container tanpa scroll horizontal.\n      Perbaiki box model-nya, bukan dengan mengurangi padding menjadi nol.\n    </p>\n  </div>\n</body>","css":"body {\n  margin: 0;\n  padding: 2rem;\n  font-family: system-ui, sans-serif;\n  background: #faf9f5;\n  color: #26251f;\n}\n\n.kartu {\n  width: 100%;\n  padding: 1.5rem;\n  border: 1px solid #e3dfd4;\n  background: #ffffff;\n}\n\n/* TODO: terapkan border-box pada semua elemen */\n\n/* TODO: batasi lebar body dan pusatkan */\n\n/* TODO: rapikan judul dan paragraf */\n","js":""}}$lcseed$::jsonb,
  2,
  35
)
on conflict (id) do update set
  course_id = excluded.course_id,
  slug = excluded.slug,
  title = excluded.title,
  summary = excluded.summary,
  content_md = excluded.content_md,
  code_example = excluded.code_example,
  exercise = excluded.exercise,
  position = excluded.position,
  estimated_minutes = excluded.estimated_minutes;

insert into public.lessons (id, course_id, slug, title, summary, content_md, code_example, exercise, position, estimated_minutes)
values (
  'af2b3863-6342-5efa-95cf-272d330b5083',
  'b61032fa-9477-5175-865b-bd023acf397f',
  $lcseed$css-flexbox-grid$lcseed$,
  $lcseed$Flexbox dan Grid untuk tata letak$lcseed$,
  $lcseed$Satu dimensi dengan Flexbox, dua dimensi dengan Grid. Kapan memakai keduanya dan bagaimana menggabungkannya.$lcseed$,
  $lcseed$Ada dua alat utama untuk menata letak modern: **Flexbox** untuk distribusi ruang dalam satu sumbu, dan **Grid** untuk menyusun baris dan kolom sekaligus.

## Flexbox: satu sumbu

Ketika sebuah container diberi `display: flex`, anak-anaknya menjadi *flex items* dan disusun sepanjang **main axis** (default horizontal).

~~~css
.baris {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
}
~~~

Properti penting:

- `flex-direction` — `row` (default) atau `column`.
- `justify-content` — distribusi sepanjang main axis.
- `align-items` — perataan pada cross axis.
- `gap` — jarak antar-item; jauh lebih rapi daripada margin.
- `flex-wrap` — izinkan item turun baris jika sempit.

Pada item, `flex: 1` artinya item boleh tumbuh dan menyusut dengan proporsi yang sama. `flex: 0 0 auto` mempertahankan ukuran alami.

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

`minmax(0, 1fr)` mencegah kolom melebar karena konten panjang. `repeat(3, ...)` membuat tiga kolom sama lebar.

Pola responsif tanpa media query:

~~~css
.grid-kartu {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(16rem, 100%), 1fr));
  gap: 1.25rem;
}
~~~

Dengan `auto-fit` dan `minmax`, browser menentukan berapa kolom yang muat. Ketika layar sempit, grid otomatis menjadi satu kolom.

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
2. **Lupa `min-width: 0` pada anak flex yang berisi teks panjang.** Tanpa itu, teks tidak menyusut dan container meluber. Pada Grid gunakan `minmax(0, 1fr)`.
3. **Menghitung lebar dengan margin.** Gunakan `gap` agar jarak konsisten dan tidak ada margin ganda di tepi.
4. **Menetapkan tinggi tetap pada kartu.** Biarkan konten menentukan tinggi; gunakan `align-items: stretch` (default) agar kartu satu baris sama tinggi.
5. **Membuat struktur HTML rumit untuk mencapai tata letak.** Sering kali CSS yang perlu diubah, bukan markup-nya.

## Alignment cepat

Pada Flexbox:

- Pusatkan isi secara horizontal dan vertikal: `justify-content: center; align-items: center;`.
- Dorong satu item ke kanan: beri `margin-left: auto` pada item tersebut.

Pada Grid:

- Pusatkan seluruh grid: `place-content: center`.
- Pusatkan item di dalam sel: `place-items: center`.

Latihan berikut meminta kamu membangun galeri kartu yang tetap rapi pada layar sempit dan lebar, dengan satu kartu yang lebih tinggi dari yang lain.$lcseed$,
  $lcseed${"language":"css","filename":"layout.css","caption":"Grid kartu responsif dan toolbar Flexbox","code":"body {\n  margin: 0;\n  padding: 2rem;\n  font-family: system-ui, sans-serif;\n  background: #faf9f5;\n  color: #26251f;\n}\n\n.toolbar {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 0.75rem;\n  margin-bottom: 1.5rem;\n}\n\n.toolbar h1 {\n  margin: 0;\n  font-size: 1.5rem;\n}\n\n.toolbar .aksi {\n  margin-left: auto;\n  padding: 0.5rem 0.875rem;\n  border: 1px solid #cbc5b6;\n  border-radius: 6px;\n  background: #ffffff;\n  font: inherit;\n  font-size: 0.875rem;\n}\n\n.grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(min(16rem, 100%), 1fr));\n  gap: 1rem;\n}\n\n.kartu {\n  display: flex;\n  flex-direction: column;\n  gap: 0.5rem;\n  padding: 1.25rem;\n  border: 1px solid #e3dfd4;\n  border-radius: 8px;\n  background: #ffffff;\n}\n\n.kartu p {\n  margin: 0;\n  color: #6a675e;\n}"}$lcseed$::jsonb,
  $lcseed${"title":"Bangun galeri kartu responsif","brief":"Gunakan Grid untuk galeri dan Flexbox untuk isi kartu. Galeri harus otomatis menjadi satu kolom pada layar sempit.","steps":["Beri .galeri display: grid dengan repeat(auto-fit, minmax(min(15rem, 100%), 1fr)).","Tambahkan gap minimal 1rem.","Buat .kartu menjadi flex column sehingga tombol di bawah selalu sejajar.","Pastikan tidak ada scroll horizontal pada lebar 360px."],"hint":"Gunakan minmax(0, 1fr) bila isi kartu panjang. Untuk menyamakan tinggi kartu, biarkan stretch sebagai default.","starter":{"html":"<body>\n  <div class=\"toolbar\">\n    <h1>Kursus saya</h1>\n    <button class=\"aksi\" type=\"button\">Filter</button>\n  </div>\n\n  <div class=\"galeri\">\n    <article class=\"kartu\">\n      <h2>HTML Fundamentals</h2>\n      <p>Struktur halaman, teks, gambar, dan formulir.</p>\n      <a href=\"#\">Lanjutkan</a>\n    </article>\n    <article class=\"kartu\">\n      <h2>CSS Fundamentals</h2>\n      <p>Box model, tipografi, Flexbox, dan Grid.</p>\n      <a href=\"#\">Lanjutkan</a>\n    </article>\n    <article class=\"kartu\">\n      <h2>JavaScript Fundamentals</h2>\n      <p>Variabel, fungsi, DOM, dan event.</p>\n      <a href=\"#\">Lanjutkan</a>\n    </article>\n  </div>\n</body>","css":"body {\n  margin: 0;\n  padding: 2rem;\n  font-family: system-ui, sans-serif;\n  background: #faf9f5;\n  color: #26251f;\n}\n\n.toolbar {\n  display: flex;\n  align-items: center;\n  gap: 1rem;\n  margin-bottom: 1.5rem;\n}\n\n.aksi {\n  margin-left: auto;\n}\n\n.galeri {\n  /* TODO: jadikan grid responsif dengan auto-fit dan minmax */\n}\n\n.kartu {\n  /* TODO: flex column agar tautan berada di bawah */\n  border: 1px solid #e3dfd4;\n  border-radius: 8px;\n  padding: 1.25rem;\n  background: #ffffff;\n}\n\n.kartu a {\n  margin-top: auto;\n  color: #1e4c3d;\n}\n","js":""}}$lcseed$::jsonb,
  3,
  38
)
on conflict (id) do update set
  course_id = excluded.course_id,
  slug = excluded.slug,
  title = excluded.title,
  summary = excluded.summary,
  content_md = excluded.content_md,
  code_example = excluded.code_example,
  exercise = excluded.exercise,
  position = excluded.position,
  estimated_minutes = excluded.estimated_minutes;

insert into public.lessons (id, course_id, slug, title, summary, content_md, code_example, exercise, position, estimated_minutes)
values (
  '0577fc84-2d2c-551c-9f21-6b946790e0f5',
  'b61032fa-9477-5175-865b-bd023acf397f',
  $lcseed$css-responsif-state-tema$lcseed$,
  $lcseed$Desain responsif, state, dan tema$lcseed$,
  $lcseed$Mobile-first, media query yang tepat, state interaksi, dan dark mode berbasis custom property.$lcseed$,
  $lcseed$Antarmuka yang baik bekerja pada lebar 360px maupun 1440px, dapat digunakan dengan keyboard, dan menghormati preferensi pengguna termasuk mode gelap dan pengurangan animasi.

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

`min-width` berarti "mulai dari lebar ini ke atas". Pendekatan ini menjaga CSS dasar tetap sederhana dan sesuai untuk perangkat yang paling terbatas.

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

`clamp(min, ideal, max)` berguna untuk tipografi dan spacing yang berskala halus:

~~~css
h1 {
  font-size: clamp(2rem, 5vw, 3.5rem);
}

.section {
  padding-block: clamp(2rem, 6vw, 5rem);
}
~~~

`min()` dan `max()` juga membantu: `width: min(100%, 40rem)` memastikan elemen tidak melebihi lebar layar.

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

Gunakan `:focus-visible` agar outline muncul untuk pengguna keyboard tetapi tidak mengganggu pengguna mouse. **Jangan** menulis `outline: none` tanpa pengganti yang terlihat.

Perhatikan: warna teks putih di atas latar hijau tua memiliki kontras yang baik. Selalu periksa kontras, terutama untuk teks kecil.

## Dark mode dengan custom property

Definisikan token warna sekali, lalu tukar nilainya berdasarkan preferensi tema. Di LearnCode, kelas `.dark` dipasang pada elemen `<html>` oleh pengguna atau preferensi sistem.

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

Hindari animasi yang menggeser tata letak, berulang terus-menerus, atau memicu mual. Selalu sediakan jalan keluar lewat `prefers-reduced-motion`.

## Daftar periksa responsif

1. Uji pada 360px, 768px, dan 1280px. Gunakan DevTools device mode.
2. Perbesar ukuran font browser menjadi 200%. Apakah tata letak tetap terbaca?
3. Navigasi seluruh halaman dengan Tab. Apakah fokus selalu terlihat?
4. Aktifkan mode gelap. Apakah teks sekunder tetap terbaca?
5. Aktifkan "reduce motion". Apakah semua animasi berhenti?

Latihan berikut menggabungkan grid responsif, state tombol, dan token tema dalam satu halaman kecil.$lcseed$,
  $lcseed${"language":"css","filename":"responsif.css","caption":"Token tema, mobile-first layout, dan state yang aksesibel","code":":root {\n  --bg: #faf9f5;\n  --surface: #ffffff;\n  --ink: #26251f;\n  --muted: #6a675e;\n  --line: #e3dfd4;\n  --accent: #1e4c3d;\n  --accent-ink: #ffffff;\n}\n\n.dark {\n  --bg: #121310;\n  --surface: #191a16;\n  --ink: #f1eee5;\n  --muted: #a5a196;\n  --line: #2d2e27;\n  --accent: #2f7158;\n}\n\n* {\n  box-sizing: border-box;\n}\n\nbody {\n  margin: 0;\n  padding: clamp(1.25rem, 5vw, 3rem);\n  background: var(--bg);\n  color: var(--ink);\n  font-family: system-ui, sans-serif;\n  line-height: 1.65;\n}\n\n.grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(min(17rem, 100%), 1fr));\n  gap: 1rem;\n  margin-top: 1.5rem;\n}\n\n.card {\n  padding: 1.25rem;\n  border: 1px solid var(--line);\n  border-radius: 8px;\n  background: var(--surface);\n}\n\n.button {\n  display: inline-flex;\n  align-items: center;\n  min-height: 2.5rem;\n  padding: 0.5rem 1rem;\n  border: 0;\n  border-radius: 6px;\n  background: var(--accent);\n  color: var(--accent-ink);\n  font: inherit;\n  font-size: 0.9rem;\n  cursor: pointer;\n}\n\n.button:hover {\n  filter: brightness(1.08);\n}\n\n.button:focus-visible {\n  outline: 2px solid var(--accent);\n  outline-offset: 2px;\n}\n\n@media (prefers-reduced-motion: no-preference) {\n  .button {\n    transition: filter 150ms ease;\n  }\n}"}$lcseed$::jsonb,
  $lcseed${"title":"Halaman yang siap untuk semua tema","brief":"Lengkapi halaman dengan token warna, grid responsif, dan state tombol yang jelas. Uji dengan mengubah kelas dark pada <html>.","steps":["Tambahkan custom property --bg, --surface, --ink, --line, dan --accent pada :root.","Buat .grid dengan auto-fit dan minmax agar menjadi satu kolom di layar sempit.","Beri .tombol state hover dan focus-visible yang terlihat.","Tambahkan aturan .dark yang mengganti nilai token, bukan properti komponen satu per satu."],"hint":"Uji tema dengan menambahkan class=\"dark\" pada <html> di editor. Pastikan teks tetap memiliki kontras yang cukup.","starter":{"html":"<html class=\"dark\">\n  <body>\n    <h1>Tema yang konsisten</h1>\n    <p>Ubah kelas pada elemen html untuk menguji mode gelap.</p>\n    <div class=\"grid\">\n      <section class=\"kartu\"><h2>HTML</h2><p>Struktur halaman.</p></section>\n      <section class=\"kartu\"><h2>CSS</h2><p>Tampilan dan tata letak.</p></section>\n      <section class=\"kartu\"><h2>JavaScript</h2><p>Interaksi dan logika.</p></section>\n    </div>\n    <button class=\"tombol\" type=\"button\">Mulai latihan</button>\n  </body>\n</html>","css":":root {\n  /* TODO: definisikan token warna terang */\n}\n\n.dark {\n  /* TODO: definisikan token warna gelap */\n}\n\n* {\n  box-sizing: border-box;\n}\n\nbody {\n  margin: 0;\n  padding: clamp(1.25rem, 5vw, 3rem);\n  background: var(--bg, #faf9f5);\n  color: var(--ink, #26251f);\n  font-family: system-ui, sans-serif;\n  line-height: 1.65;\n}\n\n.grid {\n  /* TODO: grid responsif */\n  margin-block: 1.5rem;\n}\n\n.kartu {\n  /* TODO: gunakan token untuk background dan border */\n  border: 1px solid var(--line, #e3dfd4);\n  border-radius: 8px;\n  padding: 1.25rem;\n}\n\n.tombol {\n  /* TODO: warna aksen, kontras, dan state hover/focus */\n}\n","js":""}}$lcseed$::jsonb,
  4,
  37
)
on conflict (id) do update set
  course_id = excluded.course_id,
  slug = excluded.slug,
  title = excluded.title,
  summary = excluded.summary,
  content_md = excluded.content_md,
  code_example = excluded.code_example,
  exercise = excluded.exercise,
  position = excluded.position,
  estimated_minutes = excluded.estimated_minutes;

insert into public.quizzes (id, course_id, title, description, passing_score)
values (
  'bb2a39b0-f2e9-528b-9a4b-70c3ff3a8398',
  'b61032fa-9477-5175-865b-bd023acf397f',
  $lcseed$Quiz CSS Fundamentals$lcseed$,
  $lcseed$Enam pertanyaan tentang cascade, box model, Flexbox, Grid, responsivitas, dan aksesibilitas. Nilai minimal 80%.$lcseed$,
  80
)
on conflict (id) do update set
  course_id = excluded.course_id,
  title = excluded.title,
  description = excluded.description,
  passing_score = excluded.passing_score;

insert into public.quiz_questions (id, quiz_id, prompt, code, code_language, options, correct_option_id, explanation, position)
values (
  '5bf309fe-4bd1-5e82-a731-62e4d0b25ef1',
  'bb2a39b0-f2e9-528b-9a4b-70c3ff3a8398',
  $lcseed$Apa yang dilakukan box-sizing: border-box?$lcseed$,
  null,
  null,
  $lcseed$[{"id":"a","text":"Menambahkan border ke semua elemen"},{"id":"b","text":"Menghitung padding dan border di dalam nilai width yang ditetapkan"},{"id":"c","text":"Menghapus margin default browser"},{"id":"d","text":"Membuat semua elemen menjadi flex"}]$lcseed$::jsonb,
  $lcseed$b$lcseed$,
  $lcseed$Dengan border-box, width mencakup content, padding, dan border. Ini membuat ukuran elemen lebih mudah diprediksi.$lcseed$,
  1
)
on conflict (id) do update set
  quiz_id = excluded.quiz_id,
  prompt = excluded.prompt,
  code = excluded.code,
  code_language = excluded.code_language,
  options = excluded.options,
  correct_option_id = excluded.correct_option_id,
  explanation = excluded.explanation,
  position = excluded.position;

insert into public.quiz_questions (id, quiz_id, prompt, code, code_language, options, correct_option_id, explanation, position)
values (
  'bc4755d0-fa95-5ff9-974e-c967c9bdbc87',
  'bb2a39b0-f2e9-528b-9a4b-70c3ff3a8398',
  $lcseed$Selektor mana yang lebih spesifik?$lcseed$,
  $lcseed$#kontak .card a { }  vs  .card a { }$lcseed$,
  null,
  $lcseed$[{"id":"a","text":"#kontak .card a"},{"id":"b","text":".card a"},{"id":"c","text":"Keduanya sama"},{"id":"d","text":"Tergantung urutan penulisan"}]$lcseed$::jsonb,
  $lcseed$a$lcseed$,
  $lcseed$Selektor pertama memiliki satu ID sehingga specificity-nya lebih tinggi daripada selektor yang hanya memakai kelas dan elemen.$lcseed$,
  2
)
on conflict (id) do update set
  quiz_id = excluded.quiz_id,
  prompt = excluded.prompt,
  code = excluded.code,
  code_language = excluded.code_language,
  options = excluded.options,
  correct_option_id = excluded.correct_option_id,
  explanation = excluded.explanation,
  position = excluded.position;

insert into public.quiz_questions (id, quiz_id, prompt, code, code_language, options, correct_option_id, explanation, position)
values (
  'aa4997ec-5214-50d0-9b12-a8c8aabc7089',
  'bb2a39b0-f2e9-528b-9a4b-70c3ff3a8398',
  $lcseed$Properti apa yang tepat untuk memberi jarak antar-item pada container flex tanpa margin tambahan di tepi?$lcseed$,
  null,
  null,
  $lcseed$[{"id":"a","text":"margin: 0 auto"},{"id":"b","text":"gap"},{"id":"c","text":"padding"},{"id":"d","text":"border-spacing"}]$lcseed$::jsonb,
  $lcseed$b$lcseed$,
  $lcseed$gap memberi jarak antar-item pada Flexbox dan Grid tanpa margin di sisi terluar container.$lcseed$,
  3
)
on conflict (id) do update set
  quiz_id = excluded.quiz_id,
  prompt = excluded.prompt,
  code = excluded.code,
  code_language = excluded.code_language,
  options = excluded.options,
  correct_option_id = excluded.correct_option_id,
  explanation = excluded.explanation,
  position = excluded.position;

insert into public.quiz_questions (id, quiz_id, prompt, code, code_language, options, correct_option_id, explanation, position)
values (
  '526e3fc4-2fb9-5403-860c-8813df144124',
  'bb2a39b0-f2e9-528b-9a4b-70c3ff3a8398',
  $lcseed$Kamu ingin galeri kartu otomatis menyesuaikan jumlah kolom tanpa media query. Pola Grid mana yang paling tepat?$lcseed$,
  null,
  null,
  $lcseed$[{"id":"a","text":"grid-template-columns: repeat(3, 1fr)"},{"id":"b","text":"grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr))"},{"id":"c","text":"grid-auto-flow: row dense"},{"id":"d","text":"grid-template-rows: 1fr 1fr"}]$lcseed$::jsonb,
  $lcseed$b$lcseed$,
  $lcseed$auto-fit bersama minmax memungkinkan browser menempatkan sebanyak mungkin kolom yang muat, lalu menurunkannya pada layar sempit.$lcseed$,
  4
)
on conflict (id) do update set
  quiz_id = excluded.quiz_id,
  prompt = excluded.prompt,
  code = excluded.code,
  code_language = excluded.code_language,
  options = excluded.options,
  correct_option_id = excluded.correct_option_id,
  explanation = excluded.explanation,
  position = excluded.position;

insert into public.quiz_questions (id, quiz_id, prompt, code, code_language, options, correct_option_id, explanation, position)
values (
  '1e93bc14-a5dc-5d65-8653-db41ee7b4fbf',
  'bb2a39b0-f2e9-528b-9a4b-70c3ff3a8398',
  $lcseed$Mengapa outline: none sebaiknya tidak dipakai sendirian?$lcseed$,
  null,
  null,
  $lcseed$[{"id":"a","text":"Karena membuat halaman lebih lambat"},{"id":"b","text":"Karena pengguna keyboard kehilangan indikator fokus yang penting"},{"id":"c","text":"Karena outline tidak didukung di semua browser"},{"id":"d","text":"Karena outline bertentangan dengan dark mode"}]$lcseed$::jsonb,
  $lcseed$b$lcseed$,
  $lcseed$Indikator fokus adalah sarana navigasi bagi pengguna keyboard. Jika ingin menghapusnya, ganti dengan gaya fokus yang tetap jelas, misalnya lewat :focus-visible.$lcseed$,
  5
)
on conflict (id) do update set
  quiz_id = excluded.quiz_id,
  prompt = excluded.prompt,
  code = excluded.code,
  code_language = excluded.code_language,
  options = excluded.options,
  correct_option_id = excluded.correct_option_id,
  explanation = excluded.explanation,
  position = excluded.position;

insert into public.quiz_questions (id, quiz_id, prompt, code, code_language, options, correct_option_id, explanation, position)
values (
  '945e56f5-5894-5eee-a8af-a2c2a08d1b44',
  'bb2a39b0-f2e9-528b-9a4b-70c3ff3a8398',
  $lcseed$Strategi yang tepat untuk membuat dark mode dengan token warna adalah...$lcseed$,
  null,
  null,
  $lcseed$[{"id":"a","text":"Menulis ulang setiap komponen dalam file CSS terpisah"},{"id":"b","text":"Membalik semua warna dengan filter: invert(1)"},{"id":"c","text":"Mengganti nilai custom property pada kelas .dark dan memakai token itu di semua komponen"},{"id":"d","text":"Menambahkan !important pada semua aturan gelap"}]$lcseed$::jsonb,
  $lcseed$c$lcseed$,
  $lcseed$Token warna terpusat memungkinkan dark mode hanya mengganti nilai variabel. Kontras tetap harus diperiksa secara manual di kedua tema.$lcseed$,
  6
)
on conflict (id) do update set
  quiz_id = excluded.quiz_id,
  prompt = excluded.prompt,
  code = excluded.code,
  code_language = excluded.code_language,
  options = excluded.options,
  correct_option_id = excluded.correct_option_id,
  explanation = excluded.explanation,
  position = excluded.position;

-- Course: JavaScript Fundamentals
insert into public.courses (id, slug, title, tagline, description, level, duration_minutes, objectives, passing_score, status, position)
values (
  '167fb229-1201-5868-9e76-6e675d98a753',
  $lcseed$javascript-fundamentals$lcseed$,
  $lcseed$JavaScript Fundamentals$lcseed$,
  $lcseed$Ubah halaman statis menjadi antarmuka yang merespons.$lcseed$,
  $lcseed$Dari variabel dan tipe data sampai DOM dan event. Setiap konsep diuji lewat latihan yang berjalan di browser, sehingga kamu melihat langsung efek kode yang kamu tulis.$lcseed$,
  $lcseed$pemula$lcseed$,
  180,
  array[$lcseed$Menggunakan let, const, dan tipe data dasar secara tepat.$lcseed$, $lcseed$Menulis kondisi, perulangan, dan fungsi yang mudah dibaca.$lcseed$, $lcseed$Mengolah array dan object dengan metode seperti map, filter, dan reduce.$lcseed$, $lcseed$Membaca serta memanipulasi DOM dan menangani event secara aman.$lcseed$, $lcseed$Membangun komponen interaktif kecil dari nol.$lcseed$]::text[],
  80,
  'published',
  3
)
on conflict (id) do update set
  slug = excluded.slug,
  title = excluded.title,
  tagline = excluded.tagline,
  description = excluded.description,
  level = excluded.level,
  duration_minutes = excluded.duration_minutes,
  objectives = excluded.objectives,
  passing_score = excluded.passing_score,
  status = excluded.status,
  position = excluded.position;

insert into public.lessons (id, course_id, slug, title, summary, content_md, code_example, exercise, position, estimated_minutes)
values (
  'f85d3789-e030-5672-837f-93e77ae29a6d',
  '167fb229-1201-5868-9e76-6e675d98a753',
  $lcseed$js-variabel-tipe-operator$lcseed$,
  $lcseed$Variabel, tipe data, dan operator$lcseed$,
  $lcseed$Menyimpan nilai dengan let dan const, mengenali tipe data JavaScript, dan menghindari perbandingan yang menipu.$lcseed$,
  $lcseed$JavaScript adalah bahasa yang *dinamis*: tipe nilai tidak ditulis pada deklarasi, tetapi ditentukan saat program berjalan. Memahami tipe dan operator adalah dasar untuk membaca dan menulis kode yang dapat diprediksi.

## let dan const

Gunakan `const` sebagai pilihan pertama, dan `let` ketika nilai perlu diganti.

~~~javascript
const nama = "Rani";
let jumlahLatihan = 0;

jumlahLatihan = jumlahLatihan + 1; // boleh
// nama = "Budi"; // TypeError
~~~

`const` mencegah **binding** diganti, bukan mencegah isi object diubah:

~~~javascript
const pengguna = { nama: "Rani", level: "pemula" };
pengguna.level = "menengah"; // boleh
// pengguna = {}; // tidak boleh
~~~

Hindari `var` pada kode baru. `var` memiliki function scope dan perilaku *hoisting* yang mudah menimbulkan bug.

## Tipe data primitif

| Tipe | Contoh | Catatan |
| --- | --- | --- |
| `string` | `"Halo"`, `'Halo'`, `\`Halo\`` | Teks |
| `number` | `42`, `3.14`, `NaN` | Selalu floating point |
| `boolean` | `true`, `false` | Hasil perbandingan |
| `undefined` | variabel tanpa nilai | "Belum diisi" |
| `null` | `null` | Sengaja dikosongkan |
| `bigint` | `10n` | Bilangan bulat sangat besar |
| `symbol` | `Symbol("id")` | Identifier unik |

Selain primitif, ada `object` — termasuk array dan fungsi. Gunakan `typeof` untuk memeriksa, dengan catatan `typeof null` menghasilkan `"object"`, salah satu quirk lama JavaScript.

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

const pesan = `${nama} menyelesaikan ${jumlah} latihan.`;
console.log(pesan); // Rani menyelesaikan 3 latihan.
~~~

Gunakan `${...}` hanya untuk ekspresi pendek. Jika logikanya panjang, hitung dulu di variabel terpisah agar kode tetap terbaca.

## Operator yang sering menjebak

### Perbandingan

Selalu gunakan `===` dan `!==`. Operator `==` melakukan konversi tipe otomatis dan dapat menghasilkan kejutan:

~~~javascript
0 == "";        // true
0 == false;     // true
"" == false;    // true
null == undefined; // true

0 === "";       // false
null === undefined; // false
~~~

### Kebenaran (truthiness)

Nilai berikut dianggap `false` ketika dipakai dalam kondisi:

- `false`
- `0` dan `-0`
- `""` (string kosong)
- `null`
- `undefined`
- `NaN`

Semua object dan array — termasuk `[]` dan `{}` — dianggap `true`. Ini penyebab bug klasik:

~~~javascript
if ([]) {
  console.log("Array kosong tetap dianggap truthy");
}
~~~

Untuk memeriksa array kosong, gunakan `arr.length === 0`.

### Operator modern yang berguna

~~~javascript
const nama = pengguna?.profil?.nama ?? "Tanpa nama";
const harga = 120_000;

console.log(harga.toLocaleString("id-ID")); // "120.000"
~~~

- `?.` menghentikan akses jika nilai `null` atau `undefined`.
- `??` memberi nilai default hanya untuk `null` atau `undefined`, berbeda dari `||` yang juga menangkap `0` dan `""`.

## Angka dan pembagian

~~~javascript
const total = 10 / 4;         // 2.5
const hasil = 10 % 3;         // 1 (sisa bagi)

Number.parseInt("42", 10);    // 42
Number("42px");               // NaN
Number.parseFloat("42.5px");  // 42.5
~~~

Selalu periksa `Number.isNaN()` ketika hasil konversi bisa gagal. Jangan membandingkan NaN dengan `===` karena `NaN === NaN` bernilai `false`.

## Latihan berpikir

Apa yang akan dicetak kode berikut?

~~~javascript
const nilai = 0;
const label = nilai || "kosong";
const label2 = nilai ?? "kosong";
console.log(label, label2);
~~~

Jawabannya: `"kosong" 0`. `||` menganggap `0` falsy, sedangkan `??` hanya menangani `null` dan `undefined`.

Di latihan berikutnya kamu akan menghitung total belanja dan menyusun teks struk dengan template literal.$lcseed$,
  $lcseed${"language":"javascript","filename":"variabel.js","caption":"Variabel, tipe data, dan template literal","code":"const nama = \"Rani\";\nconst latihanSelesai = 3;\nconst targetLatihan = 5;\n\nconst persentase = Math.round((latihanSelesai / targetLatihan) * 100);\nconst pesan = `${nama} menyelesaikan ${latihanSelesai} dari ${targetLatihan} latihan (${persentase}%).`;\n\nconsole.log(pesan);\n\nconst daftarKursus = [\"HTML\", \"CSS\", \"JavaScript\"];\nconsole.log(daftarKursus.length);       // 3\nconsole.log(typeof daftarKursus);       // \"object\"\nconsole.log(Array.isArray(daftarKursus)); // true\n\nconst pengguna = {\n  nama,\n  level: \"pemula\",\n  aktif: true,\n};\n\nconsole.log(pengguna?.level ?? \"tidak diketahui\");"}$lcseed$::jsonb,
  $lcseed${"title":"Hitung total belanja","brief":"Lengkapi fungsi hitungTotal di editor. Tampilkan hasilnya ke halaman, bukan hanya ke console.","steps":["Gunakan const untuk harga dan jumlah.","Hitung subtotal, lalu tambahkan pajak 11% dan bulatkan dengan Math.round.","Susun teks struk memakai template literal.","Tampilkan hasil ke elemen #hasil dengan textContent."],"hint":"Pajak dihitung dari subtotal: Math.round(subtotal * 0.11). Jangan lupa menambahkan subtotal dan pajak.","starter":{"html":"<main>\n  <h1>Struk Belanja</h1>\n  <p id=\"hasil\">Hasil akan muncul di sini.</p>\n</main>","css":"body {\n  font-family: system-ui, sans-serif;\n  padding: 1.5rem;\n  line-height: 1.6;\n}\n\nmain {\n  max-width: 30rem;\n}\n\n#hasil {\n  padding: 1rem;\n  border: 1px solid #e3dfd4;\n  border-radius: 6px;\n  background: #faf9f5;\n  white-space: pre-line;\n}","js":"const hargaSatuan = 25000;\nconst jumlah = 3;\n\n// TODO: hitung subtotal\n// TODO: hitung pajak 11% dari subtotal, bulatkan\n// TODO: hitung total\n\nconst hasil = document.querySelector(\"#hasil\");\n\n// TODO: susun teks struk dengan template literal lalu tampilkan\nhasil.textContent = \"Belum dihitung.\";\n"}}$lcseed$::jsonb,
  1,
  32
)
on conflict (id) do update set
  course_id = excluded.course_id,
  slug = excluded.slug,
  title = excluded.title,
  summary = excluded.summary,
  content_md = excluded.content_md,
  code_example = excluded.code_example,
  exercise = excluded.exercise,
  position = excluded.position,
  estimated_minutes = excluded.estimated_minutes;

insert into public.lessons (id, course_id, slug, title, summary, content_md, code_example, exercise, position, estimated_minutes)
values (
  'bc99ff6e-883b-5518-be29-f94a5064d984',
  '167fb229-1201-5868-9e76-6e675d98a753',
  $lcseed$js-kondisi-perulangan$lcseed$,
  $lcseed$Kondisi dan perulangan$lcseed$,
  $lcseed$Mengambil keputusan dengan if, switch, dan guard clause; mengulang pekerjaan dengan for dan for...of.$lcseed$,
  $lcseed$Program selalu mengambil keputusan dan mengulang pekerjaan. Menulisnya dengan jelas lebih penting daripada menulisnya sesingkat mungkin.

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

Alih-alih membuat blok `if` bersarang dalam, keluarkan kasus yang tidak valid lebih dulu:

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

Gunakan `switch` ketika satu ekspresi dibandingkan dengan beberapa nilai tetap:

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

Jangan lupa `break` atau `return` di setiap cabang. Tanpa itu, eksekusi "jatuh" ke cabang berikutnya.

## Ternary: hanya untuk pilihan sederhana

~~~javascript
const status = skor >= 80 ? "lulus" : "belum lulus";
~~~

Ternary berguna untuk satu keputusan dengan dua hasil. Jika mulai bersarang, kembalikan ke `if`.

## Perulangan

### for klasik

Cocok ketika indeks penting atau jumlah iterasi pasti:

~~~javascript
const langkah = ["Tulis struktur", "Tambahkan CSS", "Uji di browser"];

for (let i = 0; i < langkah.length; i++) {
  console.log(`${i + 1}. ${langkah[i]}`);
}
~~~

Berhati-hatilah dengan batas: `i < langkah.length` lebih aman daripada `i <= langkah.length`, yang akan mengakses indeks di luar array.

### for...of

Lebih mudah dibaca ketika kamu hanya perlu nilai:

~~~javascript
for (const item of langkah) {
  console.log(item);
}
~~~

Gunakan `for...in` hanya untuk enumerasi kunci object, dan berhati-hatilah dengan properti warisan. Untuk array, `for...of` adalah pilihan yang lebih tepat.

### while dan do...while

Gunakan `while` ketika jumlah iterasi tidak diketahui:

~~~javascript
let percobaan = 0;

while (percobaan < 3) {
  percobaan++;
  console.log(`Percobaan ke-${percobaan}`);
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
  console.log(`Ditemukan pada indeks ${indeks}`);
}
~~~

Gunakan `break` dan `continue` secukupnya. Jika terlalu banyak, pertimbangkan memecah fungsi atau memakai metode array yang lebih deklaratif.

## Latihan berikut

Kamu akan menampilkan daftar tugas dengan status berdasarkan nilai: selesai, hampir, atau belum. Ini menguji if/else, perulangan, dan penggabungan teks.$lcseed$,
  $lcseed${"language":"javascript","filename":"kondisi.js","caption":"Guard clause dan perulangan untuk ringkasan nilai","code":"const daftarNilai = [72, 88, 95, 64, 100];\n\nfunction ringkasNilai(nilai) {\n  if (!Array.isArray(nilai) || nilai.length === 0) {\n    return \"Tidak ada nilai untuk diringkas.\";\n  }\n\n  let total = 0;\n  let jumlahLulus = 0;\n\n  for (const n of nilai) {\n    total += n;\n    if (n >= 80) {\n      jumlahLulus++;\n    }\n  }\n\n  const rataRata = Math.round(total / nilai.length);\n  const status = rataRata >= 80 ? \"di atas target\" : \"perlu latihan lagi\";\n\n  return `Rata-rata ${rataRata} (${status}). ${jumlahLulus} dari ${nilai.length} nilai lulus.`;\n}\n\nconsole.log(ringkasNilai(daftarNilai));\nconsole.log(ringkasNilai([]));"}$lcseed$::jsonb,
  $lcseed${"title":"Daftar langkah belajar","brief":"Tampilkan setiap langkah dengan nomor dan status. Gunakan perulangan dan kondisi, bukan menulis HTML satu per satu.","steps":["Buat array berisi minimal empat langkah belajar.","Gunakan for...of dengan indeks (entries) atau for klasik untuk menomori langkah.","Tandai langkah pertama sebagai 'selesai' dan langkah terakhir sebagai 'berikutnya'.","Render setiap langkah ke dalam <ol id=\"daftar\"> memakai createElement, bukan innerHTML."],"hint":"Gunakan if/else if di dalam loop. Untuk indeks, for...of pada array.entries() memberi pasangan [indeks, nilai].","starter":{"html":"<main>\n  <h1>Rencana Belajar</h1>\n  <button id=\"tampilkan\" type=\"button\">Tampilkan rencana</button>\n  <ol id=\"daftar\" aria-live=\"polite\"></ol>\n</main>","css":"body {\n  font-family: system-ui, sans-serif;\n  padding: 1.5rem;\n  color: #26251f;\n}\n\nmain {\n  max-width: 32rem;\n}\n\nbutton {\n  padding: 0.5rem 0.875rem;\n  border: 1px solid #cbc5b6;\n  border-radius: 6px;\n  background: #ffffff;\n  font: inherit;\n  cursor: pointer;\n}\n\nli {\n  margin-block: 0.5rem;\n}\n\n.status {\n  font-size: 0.75rem;\n  text-transform: uppercase;\n  letter-spacing: 0.05em;\n  margin-left: 0.5rem;\n}\n\n.selesai { color: #17663a; }\n.berikutnya { color: #9a6414; }","js":"const langkah = [\n  \"Susun struktur HTML\",\n  \"Tambahkan gaya dengan CSS\",\n  \"Tambahkan interaksi dengan JavaScript\",\n  \"Uji di browser mobile\",\n];\n\nconst daftar = document.querySelector(\"#daftar\");\nconst tombol = document.querySelector(\"#tampilkan\");\n\ntombol.addEventListener(\"click\", () => {\n  daftar.textContent = \"\";\n\n  // TODO: loop langkah, buat <li> untuk setiap item\n  // TODO: tentukan status: selesai (langkah pertama), berikutnya (langkah terakhir), atau belum\n  // TODO: tampilkan nomor dan status di dalam li\n});\n"}}$lcseed$::jsonb,
  2,
  34
)
on conflict (id) do update set
  course_id = excluded.course_id,
  slug = excluded.slug,
  title = excluded.title,
  summary = excluded.summary,
  content_md = excluded.content_md,
  code_example = excluded.code_example,
  exercise = excluded.exercise,
  position = excluded.position,
  estimated_minutes = excluded.estimated_minutes;

insert into public.lessons (id, course_id, slug, title, summary, content_md, code_example, exercise, position, estimated_minutes)
values (
  '31a8005a-7189-5445-a24f-7ab9f09e5bd5',
  '167fb229-1201-5868-9e76-6e675d98a753',
  $lcseed$js-fungsi-scope-array$lcseed$,
  $lcseed$Fungsi, scope, dan pengolahan array$lcseed$,
  $lcseed$Memecah masalah menjadi fungsi kecil, memahami scope, lalu mengolah array dengan map, filter, dan reduce.$lcseed$,
  $lcseed$Fungsi adalah alat utama untuk mengelola kompleksitas. Semakin kecil dan jelas sebuah fungsi, semakin mudah kode diuji dan diubah.

## Deklarasi dan arrow function

~~~javascript
function tambah(a, b) {
  return a + b;
}

const tambahArrow = (a, b) => a + b;
~~~

Keduanya punya perbedaan penting:

- Deklarasi fungsi dapat dipanggil sebelum barisnya ditulis karena *hoisting*.
- Arrow function tidak memiliki `this` sendiri dan tidak bisa dipakai sebagai constructor.
- Arrow function cocok untuk callback pendek; deklarasi fungsi lebih terbaca untuk logika utama.

Konsistenlah dalam satu proyek. Di LearnCode, fungsi bernama memakai deklarasi, sedangkan callback pendek memakai arrow.

## Parameter dan nilai kembali

~~~javascript
function buatSapaan(nama, sapaan = "Halo") {
  return `${sapaan}, ${nama}!`;
}

function jumlahkan(...angka) {
  return angka.reduce((total, n) => total + n, 0);
}

console.log(buatSapaan("Rani"));            // Halo, Rani!
console.log(buatSapaan("Budi", "Selamat pagi")); // Selamat pagi, Budi!
console.log(jumlahkan(1, 2, 3));            // 6
~~~

Default parameter berguna ketika nilai tidak diberikan atau bernilai `undefined`. Parameter *rest* (`...`) mengumpulkan argumen menjadi array.

Jika fungsi tidak mengembalikan apa pun, nilainya `undefined`. Jangan mengandalkan efek samping ketika sebuah fungsi seharusnya mengembalikan nilai.

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
  document.querySelector("#harga").textContent = `Rp${harga.toLocaleString("id-ID")}`;
}

const hargaAkhir = hitungDiskon(250_000, 20);
tampilkanHarga(hargaAkhir);
~~~

## Scope

Variabel yang dideklarasikan dengan `const` dan `let` memiliki *block scope*: ia hanya hidup di dalam blok `{}` tempat ia dibuat.

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

Setiap pemanggilan `buatPenghitung` membuat lingkungan baru, sehingga dua penghitung tidak saling mengganggu. Pola ini berguna untuk menyimpan state lokal tanpa variabel global.

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

Tanpa tanda kurung, `{}` dianggap blok kode, bukan object.

## Mencari dan memeriksa

~~~javascript
const css = kursus.find((k) => k.judul === "CSS");   // object atau undefined
const adaJS = kursus.some((k) => k.judul === "JavaScript"); // true
const semuaSelesai = kursus.every((k) => k.selesai);  // false
const indeksCSS = kursus.findIndex((k) => k.judul === "CSS"); // 1
~~~

Gunakan `find` ketika butuh itemnya, `filter` ketika butuh semua yang cocok, dan `some` ketika hanya butuh jawaban ya/tidak.

## Peringatan: sort mengubah array

`sort()` dan `reverse()` memutasi array asli. Salin dulu jika kamu masih membutuhkan urutan awal:

~~~javascript
const urut = [...kursus].sort((a, b) => a.durasi - b.durasi);
~~~

Untuk membandingkan angka, selalu berikan fungsi pembanding. Tanpa itu, nilai dibandingkan sebagai string dan `100` akan dianggap lebih kecil dari `20`.

Latihan berikut menggabungkan fungsi murni dan metode array untuk membuat ringkasan progres.$lcseed$,
  $lcseed${"language":"javascript","filename":"fungsi.js","caption":"Fungsi murni, scope, dan metode array","code":"const modul = [\n  { judul: \"HTML\", durasi: 110, selesai: true },\n  { judul: \"CSS\", durasi: 140, selesai: false },\n  { judul: \"JavaScript\", durasi: 180, selesai: false },\n];\n\nfunction ringkasKursus(daftar) {\n  const selesai = daftar.filter((m) => m.selesai);\n  const totalMenit = daftar.reduce((total, m) => total + m.durasi, 0);\n  const menitSelesai = selesai.reduce((total, m) => total + m.durasi, 0);\n  const persentase = totalMenit === 0 ? 0 : Math.round((menitSelesai / totalMenit) * 100);\n\n  return {\n    jumlahSelesai: selesai.length,\n    total: daftar.length,\n    persentase,\n    berikutnya: daftar.find((m) => !m.selesai)?.judul ?? null,\n  };\n}\n\nconsole.log(ringkasKursus(modul));\nconsole.log(modul.length); // array asli tidak berubah"}$lcseed$::jsonb,
  $lcseed${"title":"Ringkasan progres kursus","brief":"Gunakan filter, reduce, dan find untuk membuat ringkasan. Render hasilnya dengan textContent, bukan innerHTML.","steps":["Hitung jumlah lesson yang selesai dengan filter.","Hitung persentase berdasarkan durasi, bukan jumlah lesson.","Temukan lesson berikutnya dengan find pada item yang belum selesai.","Tampilkan ringkasan di #ringkasan. Jika semua selesai, tampilkan pesan khusus."],"hint":"Gunakan reduce untuk total durasi dan durasi selesai. Jaga fungsi tetap murni: kembalikan object, lalu render terpisah.","starter":{"html":"<main>\n  <h1>Progres Kursus</h1>\n  <p id=\"ringkasan\">Menghitung...</p>\n  <ul id=\"daftar\"></ul>\n</main>","css":"body {\n  font-family: system-ui, sans-serif;\n  padding: 1.5rem;\n  line-height: 1.6;\n  color: #26251f;\n}\n\nmain { max-width: 32rem; }\n\n#ringkasan {\n  padding: 0.875rem 1rem;\n  border-left: 3px solid #1e4c3d;\n  background: #f3f1e9;\n}\n\nli.selesai { text-decoration: line-through; color: #6a675e; }","js":"const lessons = [\n  { judul: \"Variabel dan tipe data\", menit: 32, selesai: true },\n  { judul: \"Kondisi dan perulangan\", menit: 34, selesai: true },\n  { judul: \"Fungsi dan array\", menit: 38, selesai: false },\n  { judul: \"DOM dan event\", menit: 40, selesai: false },\n  { judul: \"Proyek daftar tugas\", menit: 36, selesai: false },\n];\n\n// TODO: buat fungsi ringkas(lessons) yang mengembalikan jumlah selesai, persentase, dan lesson berikutnya\n// TODO: render ringkasan ke #ringkasan\n// TODO: render setiap lesson ke #daftar, tandai yang selesai dengan class \"selesai\"\n"}}$lcseed$::jsonb,
  3,
  38
)
on conflict (id) do update set
  course_id = excluded.course_id,
  slug = excluded.slug,
  title = excluded.title,
  summary = excluded.summary,
  content_md = excluded.content_md,
  code_example = excluded.code_example,
  exercise = excluded.exercise,
  position = excluded.position,
  estimated_minutes = excluded.estimated_minutes;

insert into public.lessons (id, course_id, slug, title, summary, content_md, code_example, exercise, position, estimated_minutes)
values (
  'ad1b4e2a-e456-5c34-81d9-ddd69a0518db',
  '167fb229-1201-5868-9e76-6e675d98a753',
  $lcseed$js-dom-event$lcseed$,
  $lcseed$DOM dan event$lcseed$,
  $lcseed$Memilih elemen, mengubah konten dengan aman, merespons interaksi, dan menghindari jebakan umum.$lcseed$,
  $lcseed$DOM (Document Object Model) adalah representasi halaman yang dapat dibaca dan diubah oleh JavaScript. Ketika kamu menulis `document.querySelector("#judul")`, kamu mengambil node dari pohon DOM.

## Memilih elemen

~~~javascript
const judul = document.querySelector("h1");
const semuaTautan = document.querySelectorAll(".nav a");
const tombol = document.getElementById("simpan");
~~~

- `querySelector` mengembalikan elemen pertama yang cocok, atau `null`.
- `querySelectorAll` mengembalikan NodeList statis; ia tidak berubah ketika DOM berubah.
- `getElementById` cepat dan jelas untuk id.

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

`textContent` memperlakukan input sebagai teks biasa. `innerHTML` mem-parsing string sebagai HTML; jika isinya berasal dari pengguna, ini membuka celah **XSS** (cross-site scripting). Karena itu, gunakan `textContent` untuk data pengguna.

Jika memang perlu menyisipkan HTML dari sumber tepercaya, pastikan sudah disanitasi. Aturan praktis: **jangan pernah** memasukkan input pengguna ke `innerHTML`.

## Membuat elemen

~~~javascript
const daftar = document.querySelector("#daftar");
const item = document.createElement("li");
item.textContent = "Belajar event listener";
daftar.append(item);
~~~

`append` menerima node maupun string dan bisa menambahkan beberapa sekaligus. `prepend` menambahkan di awal.

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

Gunakan `classList` daripada memanipulasi `className` secara manual. Untuk state yang penting bagi aksesibilitas, perbarui atribut ARIA yang sesuai — misalnya `aria-expanded` pada tombol yang membuka panel.

## Event listener

~~~javascript
const tombol = document.querySelector("#hitung");
let jumlah = 0;

tombol.addEventListener("click", () => {
  jumlah += 1;
  document.querySelector("#hasil").textContent = `${jumlah} klik`;
});
~~~

Event yang sering dipakai:

- `click` pada tombol dan tautan.
- `submit` pada formulir.
- `input` saat nilai berubah (setiap ketikan).
- `change` setelah nilai dikonfirmasi.
- `keydown` untuk keyboard.
- `DOMContentLoaded` bila skrip dimuat di `<head>` tanpa `defer`.

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
  document.querySelector("#sukses").textContent = `Terima kasih, ${nama}.`;
  form.reset();
});
~~~

`preventDefault()` hanya dipakai ketika kamu benar-benar menangani perilaku default secara manual. Untuk formulir yang dikirim ke server, biarkan perilaku default berjalan.

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

`closest` menelusuri ke atas sampai menemukan elemen yang cocok. Ini juga membuat elemen yang dibuat belakangan otomatis memiliki perilaku yang sama.

## Tiga jebakan umum

1. **Menjalankan skrip sebelum DOM siap.** Letakkan `<script>` di akhir `<body>` atau gunakan atribut `defer`.
2. **Menganggap querySelector selalu menemukan elemen.** Selalu tangani `null`.
3. **Menyimpan referensi DOM yang sudah diganti.** Jika kamu me-render ulang kontainer dengan `innerHTML`, listener lama hilang. Lebih aman membuat dan menambahkan node baru secara eksplisit.

Di latihan berikut, kamu akan membuat penghitung klik dengan pesan status yang diumumkan lewat `aria-live`.$lcseed$,
  $lcseed${"language":"javascript","filename":"dom.js","caption":"Manipulasi DOM dengan textContent dan event delegation","code":"const daftar = document.querySelector(\"#daftar\");\nconst input = document.querySelector(\"#item-baru\");\nconst form = document.querySelector(\"#form-item\");\nconst status = document.querySelector(\"#status\");\n\nform.addEventListener(\"submit\", (event) => {\n  event.preventDefault();\n\n  const nilai = String(input.value ?? \"\").trim();\n  if (nilai.length === 0) {\n    status.textContent = \"Tulis nama item terlebih dahulu.\";\n    return;\n  }\n\n  const item = document.createElement(\"li\");\n  item.textContent = nilai;\n\n  const hapus = document.createElement(\"button\");\n  hapus.type = \"button\";\n  hapus.textContent = \"Hapus\";\n  hapus.dataset.hapus = \"true\";\n\n  item.append(\" \", hapus);\n  daftar.append(item);\n\n  input.value = \"\";\n  status.textContent = `\"${nilai}\" ditambahkan.`;\n});\n\ndaftar.addEventListener(\"click\", (event) => {\n  const target = event.target;\n  if (!(target instanceof HTMLElement)) return;\n  if (!target.dataset.hapus) return;\n\n  target.closest(\"li\")?.remove();\n  status.textContent = \"Item dihapus.\";\n});"}$lcseed$::jsonb,
  $lcseed${"title":"Penghitung klik yang bisa diakses","brief":"Buat penghitung yang memperbarui teks dan mengumumkan perubahan ke pembaca layar. Tombol reset harus mengembalikan nilai ke nol.","steps":["Ambil elemen #angka, #tambah, #reset, dan #pengumuman dengan querySelector.","Tambahkan event click pada tombol tambah untuk menambah nilai.","Perbarui textContent #angka setiap kali nilai berubah.","Isi #pengumuman (aria-live=polite) dengan kalimat seperti 'Jumlah klik: 3'.","Reset mengembalikan angka ke 0 dan memperbarui pengumuman."],"hint":"Simpan nilai dalam variabel let di luar handler. Panggil satu fungsi render() setelah setiap perubahan agar teks dan pengumuman selalu konsisten.","starter":{"html":"<main>\n  <h1>Penghitung Klik</h1>\n  <p class=\"angka\" id=\"angka\">0</p>\n  <div class=\"aksi\">\n    <button id=\"tambah\" type=\"button\">Tambah</button>\n    <button id=\"reset\" type=\"button\">Reset</button>\n  </div>\n  <p id=\"pengumuman\" class=\"sr\" aria-live=\"polite\"></p>\n</main>","css":"body {\n  font-family: system-ui, sans-serif;\n  padding: 1.5rem;\n  color: #26251f;\n}\n\nmain { max-width: 24rem; }\n\n.angka {\n  font-size: 3rem;\n  font-weight: 600;\n  margin: 0.5rem 0;\n  font-variant-numeric: tabular-nums;\n}\n\n.aksi { display: flex; gap: 0.5rem; }\n\nbutton {\n  padding: 0.5rem 0.9rem;\n  border: 1px solid #cbc5b6;\n  border-radius: 6px;\n  background: #fff;\n  font: inherit;\n  cursor: pointer;\n}\n\nbutton:focus-visible { outline: 2px solid #1e4c3d; outline-offset: 2px; }\n\n.sr {\n  position: absolute;\n  width: 1px;\n  height: 1px;\n  overflow: hidden;\n  clip-path: inset(50%);\n  white-space: nowrap;\n}","js":"const angka = document.querySelector(\"#angka\");\nconst tombolTambah = document.querySelector(\"#tambah\");\nconst tombolReset = document.querySelector(\"#reset\");\nconst pengumuman = document.querySelector(\"#pengumuman\");\n\nlet jumlah = 0;\n\n// TODO: buat fungsi render yang memperbarui #angka dan #pengumuman\n// TODO: pasang event click pada tombol tambah\n// TODO: pasang event click pada tombol reset\n"}}$lcseed$::jsonb,
  4,
  40
)
on conflict (id) do update set
  course_id = excluded.course_id,
  slug = excluded.slug,
  title = excluded.title,
  summary = excluded.summary,
  content_md = excluded.content_md,
  code_example = excluded.code_example,
  exercise = excluded.exercise,
  position = excluded.position,
  estimated_minutes = excluded.estimated_minutes;

insert into public.lessons (id, course_id, slug, title, summary, content_md, code_example, exercise, position, estimated_minutes)
values (
  '59533b06-e904-53ea-acbe-5f60cae9a32a',
  '167fb229-1201-5868-9e76-6e675d98a753',
  $lcseed$js-proyek-daftar-tugas$lcseed$,
  $lcseed$Proyek: daftar tugas interaktif$lcseed$,
  $lcseed$Menggabungkan state, fungsi render, event delegation, dan aksesibilitas menjadi satu komponen utuh.$lcseed$,
  $lcseed$Proyek ini menggabungkan semua konsep JavaScript sebelumnya. Kita akan membangun daftar tugas kecil dengan state di memori, render ulang yang terkontrol, serta status kosong yang jelas.

## Prinsip: state dulu, tampilan kemudian

Kesalahan umum pemula adalah membaca nilai dari DOM, mengubah DOM, lalu membaca lagi. Pola itu membuat state tersebar dan sulit diuji.

Pola yang lebih baik:

1. Simpan data di satu variabel (`tugas`).
2. Ubah data lewat fungsi kecil.
3. Panggil `render()` untuk menyesuaikan tampilan.

~~~javascript
let tugas = [
  { id: 1, judul: "Baca lesson DOM", selesai: true },
  { id: 2, judul: "Kerjakan latihan penghitung", selesai: false },
];
~~~

## Fungsi render

`render()` selalu menggambar ulang daftar dari state. Dengan begitu, tampilan tidak mungkin berbeda dari data.

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

Perhatikan penggunaan `textContent` untuk judul tugas: input pengguna diperlakukan sebagai teks, bukan HTML.

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

`map` dengan spread membuat object baru, bukan mengubah object lama. Pola ini membuat perubahan state lebih mudah dilacak.

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
  return `${selesai} dari ${tugas.length} tugas selesai.`;
}

function renderRingkasan() {
  document.querySelector("#ringkasan").textContent = ringkas();
}
~~~

Panggil `renderRingkasan()` di akhir `render()`.

## Aksesibilitas yang tidak boleh dilewatkan

- Setiap checkbox berada di dalam `<label>` sehingga teksnya dapat diklik.
- Status kosong berada di elemen dengan `role="status"` agar tidak mengganggu.
- Pesan kesalahan dihubungkan ke input dengan `aria-describedby`.
- Tombol hapus memiliki label yang jelas, bukan hanya ikon tanpa teks alternatif.
- Urutan fokus mengikuti urutan visual.

## Pengembangan lanjutan

Setelah versi dasar berjalan, coba:

- Filter "semua / aktif / selesai" dengan tombol.
- Edit judul dengan klik dua kali.
- Simpan ke penyimpanan browser (perhatikan bahwa iframe playground dibatasi, jadi fitur ini diuji di halaman biasa).

Latihan berikut meminta kamu menyelesaikan semua bagian inti. Fokus pada alur state → render → event, bukan menambah fitur.$lcseed$,
  $lcseed${"language":"javascript","filename":"tugas.js","caption":"State array, render ulang, dan event delegation","code":"let tugas = [];\nlet idBerikutnya = 1;\n\nconst form = document.querySelector(\"#form-tugas\");\nconst input = document.querySelector(\"#judul\");\nconst daftar = document.querySelector(\"#daftar\");\nconst statusKosong = document.querySelector(\"#kosong\");\n\nfunction render() {\n  daftar.replaceChildren();\n\n  for (const item of tugas) {\n    const li = document.createElement(\"li\");\n\n    const label = document.createElement(\"label\");\n    const checkbox = document.createElement(\"input\");\n    checkbox.type = \"checkbox\";\n    checkbox.checked = item.selesai;\n    checkbox.dataset.id = String(item.id);\n\n    const teks = document.createElement(\"span\");\n    teks.textContent = item.judul;\n\n    label.append(checkbox, teks);\n    li.append(label);\n    daftar.append(li);\n  }\n\n  statusKosong.hidden = tugas.length > 0;\n}\n\nform.addEventListener(\"submit\", (event) => {\n  event.preventDefault();\n  const judul = input.value.trim();\n  if (judul.length < 3) return;\n\n  tugas.push({ id: idBerikutnya++, judul, selesai: false });\n  input.value = \"\";\n  render();\n});\n\ndaftar.addEventListener(\"change\", (event) => {\n  const target = event.target;\n  if (!(target instanceof HTMLInputElement)) return;\n\n  tugas = tugas.map((item) =>\n    item.id === Number(target.dataset.id)\n      ? { ...item, selesai: target.checked }\n      : item,\n  );\n});\n\nrender();"}$lcseed$::jsonb,
  $lcseed${"title":"Selesaikan daftar tugas","brief":"Lengkapi komponen daftar tugas: tambah, centang, hapus, dan status kosong. Semua perubahan harus melalui render ulang dari state.","steps":["Lengkapi fungsi render agar membuat satu <li> untuk setiap tugas, dengan checkbox di dalam label.","Tangani submit form: validasi judul minimal 3 karakter, tambahkan tugas baru, lalu render.","Tangani change pada checkbox untuk mengubah status selesai memakai map.","Tambahkan tombol hapus dengan data-hapus dan tangani kliknya memakai filter.","Sembunyikan pesan kosong ketika daftar berisi tugas, dan tampilkan ketika kosong."],"hint":"Setiap handler hanya mengubah array tugas lalu memanggil render(). Jangan mengubah DOM secara manual di beberapa tempat.","starter":{"html":"<main>\n  <h1>Daftar Tugas</h1>\n  <form id=\"form-tugas\">\n    <label for=\"judul\">Tugas baru</label>\n    <div class=\"baris\">\n      <input id=\"judul\" name=\"judul\" type=\"text\" placeholder=\"Misal: latihan DOM\" />\n      <button type=\"submit\">Tambah</button>\n    </div>\n    <p id=\"error\" role=\"alert\" class=\"error\"></p>\n  </form>\n\n  <p id=\"kosong\" role=\"status\">Belum ada tugas. Tambahkan satu untuk memulai.</p>\n  <ul id=\"daftar\"></ul>\n</main>","css":"body {\n  font-family: system-ui, sans-serif;\n  padding: 1.5rem;\n  color: #26251f;\n  line-height: 1.6;\n}\n\nmain { max-width: 30rem; }\n\n.baris { display: flex; gap: 0.5rem; }\n\ninput[type=\"text\"] {\n  flex: 1;\n  padding: 0.5rem;\n  border: 1px solid #cbc5b6;\n  border-radius: 6px;\n  font: inherit;\n}\n\ninput[aria-invalid=\"true\"] { border-color: #a72a1f; }\n\nbutton {\n  padding: 0.5rem 0.9rem;\n  border: 1px solid #1e4c3d;\n  border-radius: 6px;\n  background: #1e4c3d;\n  color: #fff;\n  font: inherit;\n  cursor: pointer;\n}\n\nul { list-style: none; padding: 0; }\n\nli {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 0.5rem;\n  padding: 0.6rem 0;\n  border-bottom: 1px solid #e3dfd4;\n}\n\nli label { display: flex; align-items: center; gap: 0.5rem; }\n\n.tugas-selesai span { text-decoration: line-through; color: #6a675e; }\n\n.hapus {\n  background: transparent;\n  color: #a72a1f;\n  border-color: #e3dfd4;\n  padding: 0.25rem 0.5rem;\n  font-size: 0.8rem;\n}\n\n.error { color: #a72a1f; font-size: 0.85rem; min-height: 1.2em; margin: 0.35rem 0 0; }\n\n[hidden] { display: none !important; }","js":"let tugas = [\n  { id: 1, judul: \"Baca lesson DOM\", selesai: true },\n];\nlet idBerikutnya = 2;\n\nconst form = document.querySelector(\"#form-tugas\");\nconst input = document.querySelector(\"#judul\");\nconst daftar = document.querySelector(\"#daftar\");\nconst kosong = document.querySelector(\"#kosong\");\nconst error = document.querySelector(\"#error\");\n\nfunction render() {\n  daftar.replaceChildren();\n\n  // TODO: buat <li> untuk setiap tugas.\n  // Setiap li berisi label + checkbox (data-id), span judul, dan tombol hapus (data-hapus).\n  // Tandai li dengan class \"tugas-selesai\" bila item.selesai.\n\n  kosong.hidden = tugas.length > 0;\n}\n\nform.addEventListener(\"submit\", (event) => {\n  event.preventDefault();\n  // TODO: validasi judul minimal 3 karakter, set aria-invalid dan pesan error\n  // TODO: tambahkan tugas baru, kosongkan input, render, lalu fokuskan input\n});\n\ndaftar.addEventListener(\"change\", (event) => {\n  // TODO: ubah status selesai memakai map\n});\n\ndaftar.addEventListener(\"click\", (event) => {\n  // TODO: hapus tugas memakai filter ketika tombol data-hapus diklik\n});\n\nrender();\n"}}$lcseed$::jsonb,
  5,
  36
)
on conflict (id) do update set
  course_id = excluded.course_id,
  slug = excluded.slug,
  title = excluded.title,
  summary = excluded.summary,
  content_md = excluded.content_md,
  code_example = excluded.code_example,
  exercise = excluded.exercise,
  position = excluded.position,
  estimated_minutes = excluded.estimated_minutes;

insert into public.quizzes (id, course_id, title, description, passing_score)
values (
  '705f87fb-97fa-5b70-9f04-04f9f896ea5f',
  '167fb229-1201-5868-9e76-6e675d98a753',
  $lcseed$Quiz JavaScript Fundamentals$lcseed$,
  $lcseed$Enam pertanyaan tentang tipe data, kondisi, fungsi, array, dan DOM. Nilai minimal 80%.$lcseed$,
  80
)
on conflict (id) do update set
  course_id = excluded.course_id,
  title = excluded.title,
  description = excluded.description,
  passing_score = excluded.passing_score;

insert into public.quiz_questions (id, quiz_id, prompt, code, code_language, options, correct_option_id, explanation, position)
values (
  '7f175608-e782-5d7c-acd9-4686c3bdcac7',
  '705f87fb-97fa-5b70-9f04-04f9f896ea5f',
  $lcseed$Apa hasil dari kode berikut?$lcseed$,
  $lcseed$console.log(0 == "");
console.log(0 === "");$lcseed$,
  $lcseed$javascript$lcseed$,
  $lcseed$[{"id":"a","text":"true lalu true"},{"id":"b","text":"true lalu false"},{"id":"c","text":"false lalu false"},{"id":"d","text":"false lalu true"}]$lcseed$::jsonb,
  $lcseed$b$lcseed$,
  $lcseed$Operator == melakukan konversi tipe sehingga 0 dan string kosong dianggap sama. === membandingkan tipe sekaligus, sehingga hasilnya false.$lcseed$,
  1
)
on conflict (id) do update set
  quiz_id = excluded.quiz_id,
  prompt = excluded.prompt,
  code = excluded.code,
  code_language = excluded.code_language,
  options = excluded.options,
  correct_option_id = excluded.correct_option_id,
  explanation = excluded.explanation,
  position = excluded.position;

insert into public.quiz_questions (id, quiz_id, prompt, code, code_language, options, correct_option_id, explanation, position)
values (
  'cbe13276-abe5-5462-8c93-10ec140ec7ee',
  '705f87fb-97fa-5b70-9f04-04f9f896ea5f',
  $lcseed$Nilai mana yang dianggap falsy dalam kondisi JavaScript?$lcseed$,
  null,
  null,
  $lcseed$[{"id":"a","text":"[] (array kosong)"},{"id":"b","text":"{} (object kosong)"},{"id":"c","text":"0"},{"id":"d","text":"\"false\""}]$lcseed$::jsonb,
  $lcseed$c$lcseed$,
  $lcseed$0, -0, 0n, "", null, undefined, dan NaN adalah falsy. Array dan object kosong tetap truthy.$lcseed$,
  2
)
on conflict (id) do update set
  quiz_id = excluded.quiz_id,
  prompt = excluded.prompt,
  code = excluded.code,
  code_language = excluded.code_language,
  options = excluded.options,
  correct_option_id = excluded.correct_option_id,
  explanation = excluded.explanation,
  position = excluded.position;

insert into public.quiz_questions (id, quiz_id, prompt, code, code_language, options, correct_option_id, explanation, position)
values (
  '07ff85dd-cd3d-5928-983f-05340e6863d6',
  '705f87fb-97fa-5b70-9f04-04f9f896ea5f',
  $lcseed$Apa yang dikembalikan oleh array.map()?$lcseed$,
  null,
  null,
  $lcseed$[{"id":"a","text":"Item pertama yang lolos kondisi"},{"id":"b","text":"Array baru dengan panjang yang sama berisi hasil transformasi"},{"id":"c","text":"Nilai boolean"},{"id":"d","text":"Array asli yang sudah diurutkan"}]$lcseed$::jsonb,
  $lcseed$b$lcseed$,
  $lcseed$map membuat array baru dengan panjang sama. filter memilih sebagian item, find mengembalikan satu item, dan reduce merangkum menjadi satu nilai.$lcseed$,
  3
)
on conflict (id) do update set
  quiz_id = excluded.quiz_id,
  prompt = excluded.prompt,
  code = excluded.code,
  code_language = excluded.code_language,
  options = excluded.options,
  correct_option_id = excluded.correct_option_id,
  explanation = excluded.explanation,
  position = excluded.position;

insert into public.quiz_questions (id, quiz_id, prompt, code, code_language, options, correct_option_id, explanation, position)
values (
  'befd8371-c893-5508-8a99-1c8bdf4068ce',
  '705f87fb-97fa-5b70-9f04-04f9f896ea5f',
  $lcseed$Mengapa innerHTML berisiko ketika dipakai untuk menampilkan input pengguna?$lcseed$,
  null,
  null,
  $lcseed$[{"id":"a","text":"Karena innerHTML lebih lambat dari textContent"},{"id":"b","text":"Karena string diperlakukan sebagai HTML sehingga dapat mengeksekusi markup berbahaya (XSS)"},{"id":"c","text":"Karena innerHTML tidak didukung di mobile"},{"id":"d","text":"Karena innerHTML menghapus semua event listener"}]$lcseed$::jsonb,
  $lcseed$b$lcseed$,
  $lcseed$innerHTML mem-parsing HTML. Input pengguna yang berisi tag atau skrip dapat merusak halaman atau mencuri data. Gunakan textContent untuk data pengguna.$lcseed$,
  4
)
on conflict (id) do update set
  quiz_id = excluded.quiz_id,
  prompt = excluded.prompt,
  code = excluded.code,
  code_language = excluded.code_language,
  options = excluded.options,
  correct_option_id = excluded.correct_option_id,
  explanation = excluded.explanation,
  position = excluded.position;

insert into public.quiz_questions (id, quiz_id, prompt, code, code_language, options, correct_option_id, explanation, position)
values (
  'f21e1992-6b76-51a3-b3a7-95d5f0120d19',
  '705f87fb-97fa-5b70-9f04-04f9f896ea5f',
  $lcseed$Apa perbedaan let dan const?$lcseed$,
  null,
  null,
  $lcseed$[{"id":"a","text":"const tidak dapat diubah sama sekali, termasuk isi object"},{"id":"b","text":"const tidak dapat di-reassign, tetapi isi object/array masih dapat diubah"},{"id":"c","text":"let hanya berlaku di dalam fungsi, const di dalam blok"},{"id":"d","text":"Keduanya identik"}]$lcseed$::jsonb,
  $lcseed$b$lcseed$,
  $lcseed$const mengikat nama ke nilai tertentu. Mutasi properti object tetap diperbolehkan; yang dilarang adalah mengganti binding-nya.$lcseed$,
  5
)
on conflict (id) do update set
  quiz_id = excluded.quiz_id,
  prompt = excluded.prompt,
  code = excluded.code,
  code_language = excluded.code_language,
  options = excluded.options,
  correct_option_id = excluded.correct_option_id,
  explanation = excluded.explanation,
  position = excluded.position;

insert into public.quiz_questions (id, quiz_id, prompt, code, code_language, options, correct_option_id, explanation, position)
values (
  '32a65a28-f3b9-5739-aea5-d8c4c2649ad4',
  '705f87fb-97fa-5b70-9f04-04f9f896ea5f',
  $lcseed$Kamu memasang satu event listener pada <ul> dan memeriksa target untuk menangani klik pada setiap <li>. Teknik ini disebut?$lcseed$,
  null,
  null,
  $lcseed$[{"id":"a","text":"Event delegation"},{"id":"b","text":"Event bubbling prevention"},{"id":"c","text":"Mutation observer"},{"id":"d","text":"Callback hell"}]$lcseed$::jsonb,
  $lcseed$a$lcseed$,
  $lcseed$Event delegation memanfaatkan bubbling: event dari anak naik ke induk, sehingga satu listener dapat menangani banyak elemen, termasuk yang dibuat belakangan.$lcseed$,
  6
)
on conflict (id) do update set
  quiz_id = excluded.quiz_id,
  prompt = excluded.prompt,
  code = excluded.code,
  code_language = excluded.code_language,
  options = excluded.options,
  correct_option_id = excluded.correct_option_id,
  explanation = excluded.explanation,
  position = excluded.position;

-- Fill starter blog-to-course links when the blog migrations ran before this course seed.
do $lcbloglinks$
begin
  if to_regclass('public.blog_posts') is not null then
    execute $bloglinkupdate$
      update public.blog_posts as post
      set related_course_id = course.id
      from public.courses as course
      where post.related_course_id is null
        and course.status = 'published'
        and course.slug = case post.slug
          when 'html-struktur-semantik' then 'html-fundamentals'
          when 'html-form-aksesibel' then 'html-fundamentals'
          when 'css-cascade-specificity' then 'css-fundamentals'
          when 'css-box-model-responsive' then 'css-fundamentals'
          when 'css-flexbox-vs-grid' then 'css-fundamentals'
          when 'javascript-variabel-tipe' then 'javascript-fundamentals'
          when 'javascript-fungsi-scope' then 'javascript-fundamentals'
          when 'javascript-dom-events' then 'javascript-fundamentals'
          when 'debugging-javascript' then 'javascript-fundamentals'
          when 'belajar-coding-proyek-daftar-tugas' then 'javascript-fundamentals'
          else null
        end;
    $bloglinkupdate$;
  end if;
end
$lcbloglinks$;

-- Ensure PostgREST sees the new rows immediately.
notify pgrst, 'reload schema';

