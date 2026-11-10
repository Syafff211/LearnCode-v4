# Laporan perubahan: Resend SMTP dan kode verifikasi pendaftaran

**Status:** implementasi di repository selesai. Hosted Supabase/Resend belum diubah; pemilik project perlu menerapkan langkah dashboard pada panduan SMTP.

## Perilaku yang dibuat

- Form `/register` sekarang menjelaskan verifikasi email dan, setelah pendaftaran yang menunggu konfirmasi, menampilkan input kode OTP.
- Kode 6–10 digit divalidasi di server dan diverifikasi melalui Supabase Auth `verifyOtp` (`type: email`). Password tidak dikirim ulang saat verifikasi.
- Tersedia tindakan **Kirim ulang kode** melalui Supabase Auth `resend`, dengan validasi input dan pembatasan percobaan tambahan di server.
- Jika email belum dikonfirmasi saat login, pengguna mendapat petunjuk kembali ke pendaftaran untuk meminta kode baru.
- Login otomatis setelah signup hanya terjadi jika Supabase mengembalikan sesi—biasanya berarti **Confirm email** dimatikan. Untuk mewajibkan OTP, pemilik project harus mengaktifkan Confirm email.
- SMTP Resend dikonfigurasi di Supabase Dashboard. Tidak ada API key SMTP/Resend yang ditambahkan ke kode, `.env.example`, atau `.env.local`.

## File baru

- `supabase/email-templates/README.md` — daftar template, subject, dan instruksi salin-tempel.
- `supabase/email-templates/confirm-signup.html` — kode OTP untuk konfirmasi pendaftaran (`{{ .Token }}`, tanpa `{{ .ConfirmationURL }}`).
- `supabase/email-templates/magic-link-or-otp.html` — kode email untuk alur passwordless.
- `supabase/email-templates/reset-password.html` — tautan reset password.
- `supabase/email-templates/change-email.html` — konfirmasi perubahan email.
- `supabase/email-templates/invite-user.html` — template undangan.
- `supabase/email-templates/reauthentication.html` — kode konfirmasi identitas.
- `tests/unit/auth-validation.test.ts` — uji validasi OTP dan alamat email.
- `docs/reports/resend-supabase-otp-report.md` — laporan perubahan ini.

## File diperbarui

- `.env.example` — menjelaskan SMTP Supabase tidak diatur lewat env aplikasi.
- `README.md` — dokumentasi Resend, Confirm email, template OTP, redirect URL, dan checklist produksi.
- `docs/supabase-smtp-template.md` — langkah setup khusus Resend dan seluruh template Auth.
- `src/lib/actions/auth.ts` — signup OTP, verifikasi server-side, resend, redirect aman, serta rate limit.
- `src/lib/validation/auth.ts` — schema kode OTP dan permintaan resend.
- `src/app/(auth)/register/register-form.tsx` — UI masukkan/verifikasi/kirim ulang kode.
- `src/app/(auth)/login/login-form.tsx` — tautan bantuan untuk email yang belum diverifikasi.
- `e2e/public.spec.ts` — assertion bahwa halaman daftar menjelaskan kode verifikasi.

## Pemeriksaan yang dijalankan

- `npm run lint` — lulus.
- `npm run typecheck` — lulus.
- `npm test` — 94 test lulus.
- `npm run build` — berhasil.
- `npx playwright test e2e/public.spec.ts` — 9 test lulus.
- Full Playwright suite belum dapat diverifikasi bersih di sandbox ini karena local Supabase/DB tidak aktif; 11 pemeriksaan admin memerlukan Supabase terkonfigurasi. Pemeriksaan non-admin yang berjalan lulus.

## Langkah dashboard yang masih wajib

1. Verifikasi domain dan record DNS yang diberikan Resend; buat API key Resend.
2. Di Supabase **Authentication → Email → SMTP Settings**, aktifkan custom SMTP dan isi:
   - host `smtp.resend.com`
   - port `465`
   - username `resend`
   - password: API key Resend (isi langsung di dashboard)
   - sender name `LearnCode`
   - sender email pada domain yang telah diverifikasi
3. Aktifkan **Confirm email** untuk provider Email di Supabase.
4. Salin `confirm-signup.html` ke **Email Templates → Confirm signup**. Pastikan template tersebut berisi `{{ .Token }}` dan tidak memuat `{{ .ConfirmationURL }}` jika ingin kode input.
5. Atur Site URL dan redirect URL production/development sesuai panduan `docs/supabase-smtp-template.md`, lalu uji signup dari `/register`.
