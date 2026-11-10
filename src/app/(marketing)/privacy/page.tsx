import type { Metadata } from "next";
import Link from "next/link";

import { PageBreadcrumbs } from "@/components/marketing/page-breadcrumbs";
import { getPlatformSettings } from "@/lib/platform";
import { canonicalUrl } from "@/lib/seo";

const title = "Kebijakan Privasi LearnCode";
const description =
  "Pelajari data akun, progres belajar, percakapan AI Tutor, cookies dan penyimpanan browser LearnCode, serta pilihan dan hak pengguna.";
const pageUrl = canonicalUrl("/privacy");

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: pageUrl },
  openGraph: {
    title,
    description,
    url: pageUrl,
    type: "website",
    siteName: "LearnCode",
    locale: "id_ID",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export const dynamic = "force-dynamic";

function safeContactEmail(value: string | null): string | null {
  const email = value?.trim();
  return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function safeContactUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export default async function PrivacyPage() {
  const platform = await getPlatformSettings();
  const contactEmail = safeContactEmail(platform.contactEmail);
  const contactUrl = safeContactUrl(platform.contactUrl);

  return (
    <div className="container-lc py-8 sm:py-12 lg:py-14">
      <article className="mx-auto max-w-3xl">
        <PageBreadcrumbs label="Kebijakan Privasi" path="/privacy" />

        <header className="mt-8 border-b border-line pb-7 sm:pb-9">
          <p className="eyebrow">Informasi dan pengelolaan data</p>
          <h1 className="display-section mt-2">Kebijakan Privasi LearnCode</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">
            Kebijakan ini menjelaskan data yang diproses saat Anda menggunakan LearnCode, alasan
            pemrosesannya, layanan yang terlibat, dan cara mengajukan permintaan terkait data Anda.
          </p>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
            Terakhir diperbarui: <time dateTime="2026-10-17">17 Oktober 2026</time>
          </p>
        </header>

        <div className="divide-y divide-line text-sm leading-7 text-ink-soft">
          <section aria-labelledby="pendahuluan" className="py-7 sm:py-8">
            <h2 id="pendahuluan" className="display-title text-ink">
              1. Pendahuluan
            </h2>
            <p className="mt-3">
              Kebijakan ini berlaku untuk LearnCode, termasuk halaman publik dan fitur belajar yang
              tersedia setelah masuk. LearnCode menggunakan layanan pihak ketiga untuk autentikasi,
              penyimpanan data aplikasi, dan pembuatan jawaban AI sebagaimana dijelaskan di bawah.
              Kami berupaya membatasi pemrosesan pada kebutuhan akun dan operasional fitur tersebut.
            </p>
          </section>

          <section aria-labelledby="data" className="py-7 sm:py-8">
            <h2 id="data" className="display-title text-ink">
              2. Data yang kami proses
            </h2>
            <div className="mt-4 space-y-5">
              <div>
                <h3 className="font-semibold text-ink">Akun dan autentikasi</h3>
                <p className="mt-1">
                  Saat Anda mendaftar atau masuk, Supabase Auth memproses informasi akun seperti
                  alamat email, identitas autentikasi, dan sesi masuk. Profil LearnCode dapat
                  menyimpan nama, foto profil bila tersedia, bahasa pilihan, serta tema. Kata sandi
                  dikelola oleh Supabase Auth, bukan ditampilkan sebagai isi profil LearnCode. Jika
                  Anda memilih masuk dengan Google ketika opsi itu tersedia, proses autentikasi
                  juga melibatkan Google dan informasi profil yang diperlukan untuk membuat akun.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-ink">Progres, quiz, dan sertifikat</h3>
                <p className="mt-1">
                  Untuk menampilkan perjalanan belajar, database menyimpan lesson yang diselesaikan
                  dan waktunya, percobaan quiz beserta pilihan jawaban, skor, status kelulusan, serta
                  catatan penggunaan kuota AI. Jika sertifikat diterbitkan, LearnCode menyimpan
                  nama penerima, kursus, nilai akhir, nomor dan tanggal terbit, serta kode
                  verifikasinya.
                </p>
                <p className="mt-2">
                  Kode verifikasi sertifikat membuka halaman publik yang menampilkan nama penerima,
                  judul kursus, nilai, tanggal terbit, nomor sertifikat, dan statusnya. Halaman
                  tersebut tidak memerlukan login; siapa pun yang memiliki tautannya dapat melihat
                  informasi itu. Hindari membagikan tautan verifikasi jika Anda tidak ingin
                  informasi sertifikat tersebut diakses orang lain.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-ink">Percakapan AI Tutor</h3>
                <p className="mt-1">
                  Pertanyaan dan jawaban AI disimpan sebagai riwayat percakapan pada akun Anda.
                  Untuk menghasilkan jawaban, server LearnCode dapat mengirim teks pertanyaan,
                  kode yang Anda sertakan, bahasa pilihan, serta konteks lesson dan bagian riwayat
                  percakapan yang relevan ke Groq. Jangan masukkan kata sandi, kunci API, atau
                  informasi pribadi yang tidak diperlukan ke dalam prompt atau kode.
                </p>
                <p className="mt-2">
                  Anda dapat menghapus satu percakapan beserta pesannya dari fitur riwayat AI
                  Tutor. Menghapus percakapan tidak sama dengan menghapus akun atau data belajar
                  lainnya.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-ink">Data yang tersimpan di browser</h3>
                <p className="mt-1">
                  Pilihan tema dan proyek Playground yang Anda simpan berada di penyimpanan browser
                  pada perangkat tersebut. Kode Playground tidak otomatis menjadi bagian dari akun.
                  Jika Anda menyalin kode atau teks itu ke AI Tutor, data tersebut akan diproses
                  sebagaimana dijelaskan pada bagian AI Tutor.
                </p>
              </div>
            </div>
          </section>

          <section aria-labelledby="tujuan-pemrosesan" className="py-7 sm:py-8">
            <h2 id="tujuan-pemrosesan" className="display-title text-ink">
              3. Tujuan penggunaan data
            </h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 marker:text-accent-text">
              <li>Membuat dan mengamankan akun serta menjaga sesi masuk tetap berfungsi.</li>
              <li>Menyimpan profil, progres belajar, hasil quiz, dan sertifikat yang Anda peroleh.</li>
              <li>Menjawab permintaan AI Tutor dan menerapkan batas penggunaan fitur AI.</li>
              <li>Mengingat pilihan tampilan dan mengatur frekuensi tampilan promosi di browser.</li>
              <li>Menjaga keamanan layanan, mencegah penyalahgunaan, dan memperbaiki gangguan teknis.</li>
            </ul>
          </section>

          <section aria-labelledby="cookies" className="py-7 sm:py-8">
            <h2 id="cookies" className="display-title text-ink">
              4. Cookies dan penyimpanan browser
            </h2>
            <p className="mt-3">
              LearnCode menggunakan cookies dan penyimpanan lokal untuk fungsi aplikasi, bukan
              untuk menyimpan isi proyek Playground di akun. Yang digunakan dalam implementasi saat
              ini meliputi:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-accent-text">
              <li>
                <strong className="font-semibold text-ink">Cookies sesi Supabase</strong> untuk
                mengenali sesi autentikasi dan mempertahankan status masuk.
              </li>
              <li>
                <strong className="font-semibold text-ink">learncode-theme</strong> pada cookie
                dan localStorage untuk mengingat tema terang, gelap, atau mengikuti pengaturan
                perangkat.
              </li>
              <li>
                <strong className="font-semibold text-ink">learncode-playground-v1</strong> pada
                localStorage untuk menyimpan berkas HTML, CSS, dan JavaScript Playground di browser
                yang digunakan.
              </li>
              <li>
                <strong className="font-semibold text-ink">Penanda frekuensi promosi</strong> pada
                localStorage atau sessionStorage agar pop-up tidak selalu ditampilkan sesuai
                pengaturannya. Jika kampanye memakai batas sekali per akun, catatan tampilan juga
                dapat disimpan di database untuk menerapkan batas tersebut.
              </li>
            </ul>
            <p className="mt-3">
              Anda dapat menghapus cookies atau data situs melalui pengaturan browser. Menghapus
              cookies sesi akan membuat Anda keluar dari akun; menghapus localStorage dapat
              mereset tema, proyek yang tersimpan, atau frekuensi promosi. Tindakan itu tidak
              menghapus progres atau data lain yang sudah tersimpan di server.
            </p>
          </section>

          <section aria-labelledby="pihak-ketiga" className="py-7 sm:py-8">
            <h2 id="pihak-ketiga" className="display-title text-ink">
              5. Layanan pihak ketiga
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-accent-text">
              <li>
                <strong className="font-semibold text-ink">Supabase</strong> menyediakan
                autentikasi berbasis sesi dan infrastruktur database yang menyimpan data akun,
                profil, progres, quiz, sertifikat, serta percakapan AI. Pelajari juga{" "}
                <a
                  href="https://supabase.com/privacy"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-accent-text underline underline-offset-4"
                >
                  kebijakan privasi Supabase
                </a>
                .
              </li>
              <li>
                <strong className="font-semibold text-ink">Groq</strong> menerima prompt dan
                konteks yang diperlukan untuk menghasilkan jawaban AI Tutor. Pemrosesan oleh Groq
                tunduk pada kebijakan penyedianya; LearnCode tidak mengatur jadwal retensi internal
                Groq. Lihat{" "}
                <a
                  href="https://groq.com/privacy-policy"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-accent-text underline underline-offset-4"
                >
                  kebijakan privasi Groq
                </a>
                .
              </li>
              <li>
                Jika Anda memilih login Google, Google memproses autentikasi sesuai kebijakannya.
                Baca{" "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-accent-text underline underline-offset-4"
                >
                  kebijakan privasi Google
                </a>
                .
              </li>
            </ul>
            <p className="mt-3">
              Layanan tersebut memiliki kebijakan dan praktik penyimpanan masing-masing. LearnCode
              tidak mengendalikan pemrosesan yang dilakukan penyedia setelah data dikirim kepada
              mereka.
            </p>
          </section>

          <section aria-labelledby="penyimpanan-keamanan" className="py-7 sm:py-8">
            <h2 id="penyimpanan-keamanan" className="display-title text-ink">
              6. Penyimpanan dan keamanan
            </h2>
            <p className="mt-3">
              Data akun dan data belajar yang tersimpan di server berada pada layanan Supabase.
              Kebijakan aplikasi membatasi akses menggunakan autentikasi, pemeriksaan server, dan
              aturan akses berbasis akun di database; pengelola yang berwenang juga dapat mengakses
              data yang diperlukan untuk mengoperasikan layanan. Kami menjaga kredensial layanan
              istimewa agar digunakan di sisi server, tetapi tidak ada sistem yang dapat menjamin
              keamanan secara mutlak.
            </p>
            <p className="mt-3">
              Aplikasi saat ini tidak menetapkan jadwal penghapusan otomatis untuk catatan progres,
              percobaan quiz, atau sertifikat. Data tersebut disimpan untuk menyediakan fitur akun
              dan pencatatan hasil belajar. Riwayat AI Tutor dapat Anda hapus melalui fitur yang
              tersedia. Ketentuan penyimpanan setelah data dikirim ke penyedia layanan diatur oleh
              kebijakan penyedia tersebut, bukan ditetapkan oleh LearnCode.
            </p>
          </section>

          <section aria-labelledby="hak-pengguna" className="py-7 sm:py-8">
            <h2 id="hak-pengguna" className="display-title text-ink">
              7. Pilihan dan hak Anda
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-accent-text">
              <li>
                Lihat progres, hasil quiz, dan sertifikat melalui halaman akun; ubah nama, bahasa,
                atau tema melalui pengaturan profil yang tersedia.
              </li>
              <li>Hapus percakapan AI Tutor dari riwayat percakapan.</li>
              <li>
                Ajukan permintaan akses, koreksi, atau penanganan data akun dengan menghubungi
                pengelola LearnCode. Permintaan dapat memerlukan verifikasi kepemilikan akun.
              </li>
              <li>
                Penghapusan akun belum tersedia sebagai tombol mandiri di aplikasi. Untuk meminta
                penghapusan akun atau data, hubungi pengelola. Pengelola akan meninjau permintaan
                dan menjelaskan data yang dapat dihapus serta catatan yang mungkin perlu ditangani
                terpisah, termasuk sertifikat yang memiliki halaman verifikasi publik.
              </li>
            </ul>
          </section>

          <section aria-labelledby="perubahan" className="py-7 sm:py-8">
            <h2 id="perubahan" className="display-title text-ink">
              8. Perubahan kebijakan
            </h2>
            <p className="mt-3">
              Kebijakan ini dapat diperbarui saat fitur atau cara pemrosesan berubah. Versi terbaru
              akan diterbitkan pada halaman ini bersama tanggal pembaruannya. Silakan periksa
              kembali halaman ini dari waktu ke waktu.
            </p>
          </section>

          <section aria-labelledby="kontak" className="py-7 sm:py-8">
            <h2 id="kontak" className="display-title text-ink">
              9. Kontak pengelola
            </h2>
            <p className="mt-3">
              Untuk pertanyaan atau permintaan mengenai kebijakan ini dan data akun, hubungi
              pengelola LearnCode melalui kanal yang dikonfigurasi untuk platform:
            </p>
            {contactEmail || contactUrl ? (
              <ul className="mt-3 space-y-2">
                {contactEmail ? (
                  <li>
                    Email: {" "}
                    <a
                      href={`mailto:${contactEmail}`}
                      className="break-all font-medium text-accent-text underline underline-offset-4"
                    >
                      {contactEmail}
                    </a>
                  </li>
                ) : null}
                {contactUrl ? (
                  <li>
                    <a
                      href={contactUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all font-medium text-accent-text underline underline-offset-4"
                    >
                      Buka kanal kontak pengelola
                    </a>
                  </li>
                ) : null}
              </ul>
            ) : (
              <p className="mt-3 rounded-[6px] border border-line bg-surface-2/60 px-4 py-3 text-sm">
                Kanal kontak pengelola belum dikonfigurasi pada instance ini.
              </p>
            )}
            <p className="mt-4 text-xs leading-6 text-muted">
              Informasi tentang platform juga tersedia di halaman{" "}
              <Link href="/about" className="font-medium text-accent-text underline underline-offset-4">
                Tentang LearnCode
              </Link>
              .
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
