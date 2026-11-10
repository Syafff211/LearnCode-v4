# LearnCode Auth email templates

HTML siap salin-tempel untuk **Supabase Dashboard → Authentication → Email Templates**. File-file ini tidak memasang template otomatis ke hosted Supabase; admin proyek perlu menyalin subject dan body-nya ke template yang sesuai.

| Template Supabase | Subject yang disarankan | File |
|---|---|---|
| Confirm signup | `Kode verifikasi LearnCode` | `confirm-signup.html` |
| Magic link or OTP | `Kode masuk LearnCode` | `magic-link-or-otp.html` |
| Reset Password | `Atur ulang password LearnCode` | `reset-password.html` |
| Change Email Address | `Konfirmasi email baru LearnCode` | `change-email.html` |
| Invite User | `Undangan LearnCode` | `invite-user.html` |
| Reauthentication | `Kode konfirmasi identitas LearnCode: {{ .Token }}` | `reauthentication.html` |

Untuk pendaftaran dengan kode, **Confirm signup harus menggunakan `{{ .Token }}`**. Jangan sertakan `{{ .ConfirmationURL }}` pada template Confirm signup bila tujuannya hanya mengirim kode, bukan magic link. Aktifkan juga **Confirm email** di provider Email Supabase.

Pengaturan SMTP Resend dan langkah lengkap ada di [`../../docs/supabase-smtp-template.md`](../../docs/supabase-smtp-template.md).
