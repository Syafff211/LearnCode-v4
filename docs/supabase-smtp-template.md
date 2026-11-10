# Resend + Supabase Auth: template konfigurasi LearnCode

Panduan ini mengatur pengiriman email autentikasi LearnCode melalui **Resend**, termasuk alur daftar akun dengan kode OTP. Email dikirim oleh Supabase Auth; aplikasi Next.js tidak mengirim email langsung.

## 1. Siapkan domain dan kredensial Resend

1. Buat/verifikasi domain pengirim di akun Resend.
2. Pasang record DNS yang ditampilkan Resend (SPF/DKIM, dan DMARC bila disarankan). Jangan menebak isi record DNS; salin nilai persis dari dashboard Resend.
3. Buat API key di Resend untuk SMTP. Simpan dengan aman—jangan kirim ke chat, source code, atau Git.
4. Gunakan detail SMTP Resend berikut di Supabase:

| Kolom SMTP | Nilai |
|---|---|
| SMTP host | `smtp.resend.com` |
| SMTP port | `465` |
| SMTP username | `resend` |
| SMTP password | API key Resend milik Anda (`re_...`) |
| Sender email | `no-reply@domain-anda.com` — harus berada pada domain terverifikasi di Resend |
| Sender name | `LearnCode` |

**Jangan mengganti `re_...` dengan contoh di atas.** Masukkan API key yang sebenarnya langsung ke Supabase Dashboard. Nilai SMTP tidak perlu ditambahkan ke `.env.local` atau Vercel karena LearnCode menggunakan SMTP milik Supabase Auth.

## 2. Atur Supabase agar pendaftaran wajib memakai kode

Di Supabase Dashboard:

1. Buka **Authentication → Sign In / Providers → Email** dan aktifkan **Confirm email**. Ini wajib agar pendaftaran tidak langsung membuat sesi sebelum email diverifikasi.
2. Buka **Authentication → Email → SMTP Settings** (nama/submenu dapat sedikit berbeda), aktifkan **Custom SMTP**, lalu isi nilai tabel Resend di atas dan simpan.
3. Buka **Authentication → URL Configuration**:
   - **Site URL**: `https://domain-aplikasi-anda.com`
   - Tambahkan URL redirect aplikasi: `https://domain-aplikasi-anda.com/auth/callback` dan `https://domain-aplikasi-anda.com/auth/confirm`
   - Untuk development lokal, tambahkan `http://localhost:3000/auth/callback` dan `http://localhost:3000/auth/confirm`.
4. Pertahankan masa berlaku kode OTP sesuai kebijakan Anda. LearnCode menerima kode numerik 6–10 digit; pengaturan standar Supabase umumnya 6 digit.

### Template Confirm signup — kode verifikasi (wajib)

Buka **Authentication → Email Templates → Confirm signup**. Atur subject menjadi:

```text
Kode verifikasi LearnCode
```

Salin isi dari [`supabase/email-templates/confirm-signup.html`](../supabase/email-templates/confirm-signup.html) ke kolom HTML body. Template ini memuat `{{ .Token }}` dan **sengaja tidak memuat** `{{ .ConfirmationURL }}`: pengguna memasukkan kode di halaman pendaftaran, bukan mengeklik tautan.

Setelah registrasi, LearnCode menampilkan form kode dan memverifikasinya di server dengan Supabase Auth `verifyOtp` (`type: email`). Tombol **Kirim ulang kode** menggunakan Supabase Auth `resend` dengan tipe signup dan memiliki pembatasan percobaan.

## 3. Template email Auth lain

File di bawah adalah HTML siap salin-tempel. Atur subject sesuai tabel, lalu tempel seluruh isi file ke template yang cocok di Supabase. Template selain Confirm signup hanya berpengaruh jika fitur terkait dipakai.

| Template Supabase | Subject | File HTML |
|---|---|---|
| Confirm signup | `Kode verifikasi LearnCode` | `supabase/email-templates/confirm-signup.html` |
| Magic link or OTP | `Kode masuk LearnCode` | `supabase/email-templates/magic-link-or-otp.html` |
| Reset Password | `Atur ulang password LearnCode` | `supabase/email-templates/reset-password.html` |
| Change Email Address | `Konfirmasi email baru LearnCode` | `supabase/email-templates/change-email.html` |
| Invite User | `Undangan LearnCode` | `supabase/email-templates/invite-user.html` |
| Reauthentication | `Kode konfirmasi identitas LearnCode: {{ .Token }}` | `supabase/email-templates/reauthentication.html` |

**Catatan:** template reset password tetap memakai `{{ .ConfirmationURL }}` agar cocok dengan alur `/auth/callback?type=recovery&next=/reset-password` yang sudah ada. Template perubahan email memakai `{{ .NewEmail }}` dan `{{ .ConfirmationURL }}`. Template Magic link or OTP mengirim kode OTP untuk alur passwordless; pendaftaran/password biasa memakai template Confirm signup.

## 4. Uji alur dari ujung ke ujung

1. Deploy aplikasi dengan `NEXT_PUBLIC_APP_URL` menunjuk ke domain publik yang sama dengan Site URL Supabase.
2. Pastikan domain pengirim di Resend berstatus verified dan custom SMTP tersimpan di Supabase.
3. Buka `/register`, buat akun dengan alamat email yang dapat Anda akses.
4. Pastikan email bertema **Kode verifikasi LearnCode** diterima (cek spam), masukkan kodenya di halaman pendaftaran, lalu pastikan aplikasi masuk ke dashboard.
5. Uji juga **Kirim ulang kode**, login, dan lupa password. Periksa log email Resend dan log Auth Supabase bila email tidak terkirim.

## Keamanan

- Jangan menambahkan API key Resend/SMTP ke `NEXT_PUBLIC_*`, file `.env.example`, database aplikasi, atau commit Git.
- Jangan menaruh token, password, atau rahasia lain pada email. OTP hanya untuk verifikasi dan tidak boleh diminta lewat chat.
- Jika API key pernah terekspos, cabut/ganti di Resend lalu perbarui password SMTP di Supabase.
- Perubahan dashboard Supabase dan DNS Resend harus dilakukan oleh pemilik domain/proyek. File di repositori adalah template; file tersebut tidak mengubah pengaturan hosted Supabase secara otomatis.
