"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ArrowUpRight, Eye, Save } from "lucide-react";
import { toast } from "sonner";

import { FormField, FormMessage } from "@/components/admin/primitives";
import { StorageImageUpload } from "@/components/admin/storage-image-upload";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { PromotionPopupLivePreview } from "@/components/promotional/PromotionPopupLivePreview";
import {
  DEFAULT_PROMOTION_DISPLAY,
  DEFAULT_PROMOTION_STYLE,
  PROMOTION_AUDIENCES,
  PROMOTION_FREQUENCIES,
  PROMOTION_PAGE_TARGETS,
  PROMOTION_POSITIONS,
  PROMOTION_SIZES,
  PROMOTION_TYPES,
  type PromotionAudience,
  type PromotionFrequency,
  type PromotionPageTarget,
  type PromotionPopupAdmin,
  type PromotionType,
} from "@/lib/promotional-popup";
import { IDLE_ADMIN_STATE, type AdminActionState } from "@/lib/actions/admin-state";
import { parsePromotionalPopupForm } from "@/lib/validation/promotional-popup";

const TARGET_LABELS: Record<PromotionPageTarget, string> = {
  homepage: "Beranda",
  courses: "Katalog dan detail kursus",
  lessons: "Materi belajar",
  blog: "Blog dan kategori",
  dashboard: "Dashboard dan pengaturan pengguna",
  playground: "Playground",
  ai_tutor: "AI Tutor",
  all_public: "Semua halaman publik",
  all_user: "Semua halaman pengguna masuk",
  custom: "Path khusus",
};

const FREQUENCY_LABELS: Record<PromotionFrequency, string> = {
  every_reload: "Setiap full reload",
  once_per_session: "Sekali per sesi browser",
  once_per_day: "Sekali per hari",
  once_per_user: "Sekali per akun LearnCode",
  every_visit: "Setiap kunjungan halaman",
};

const AUDIENCE_LABELS: Record<PromotionAudience, string> = {
  all: "Semua pengunjung",
  guest: "Tamu saja",
  authenticated: "Pengguna yang masuk",
};

const TYPE_LABELS: Record<PromotionType, string> = {
  promotion: "Promosi",
  announcement: "Pengumuman",
  information: "Informasi",
  custom: "Kustom",
};

function toUtcInput(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "" : date.toISOString().slice(0, 16);
}

type PopupFormAction = (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;

export function PromotionalPopupForm({
  action,
  popup,
}: {
  action: PopupFormAction;
  popup?: PromotionPopupAdmin;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_ADMIN_STATE);
  const [title, setTitle] = useState(popup?.title ?? "");
  const [description, setDescription] = useState(popup?.description ?? "");
  const [imagePath, setImagePath] = useState(popup?.imagePath ?? "");
  const [imageUrl, setImageUrl] = useState(popup?.imageUrl ?? "");
  const [imageAlt, setImageAlt] = useState(popup?.imageAlt ?? "");
  const [primaryText, setPrimaryText] = useState(popup?.primaryButtonText ?? "");
  const [primaryUrl, setPrimaryUrl] = useState(popup?.primaryButtonUrl ?? "");
  const [secondaryText, setSecondaryText] = useState(popup?.secondaryButtonText ?? "");
  const [secondaryUrl, setSecondaryUrl] = useState(popup?.secondaryButtonUrl ?? "");
  const [backgroundColor, setBackgroundColor] = useState(popup?.stylingConfig.backgroundColor ?? DEFAULT_PROMOTION_STYLE.backgroundColor);
  const [textColor, setTextColor] = useState(popup?.stylingConfig.textColor ?? DEFAULT_PROMOTION_STYLE.textColor);
  const [buttonColor, setButtonColor] = useState(popup?.stylingConfig.buttonColor ?? DEFAULT_PROMOTION_STYLE.buttonColor);
  const [buttonTextColor, setButtonTextColor] = useState(popup?.stylingConfig.buttonTextColor ?? DEFAULT_PROMOTION_STYLE.buttonTextColor);
  const [position, setPosition] = useState(popup?.stylingConfig.position ?? DEFAULT_PROMOTION_STYLE.position);
  const [size, setSize] = useState(popup?.stylingConfig.size ?? DEFAULT_PROMOTION_STYLE.size);
  const [backdropClose, setBackdropClose] = useState(popup?.stylingConfig.backdropClose ?? true);
  const [popupType, setPopupType] = useState<PromotionType>(popup?.popupType ?? "promotion");
  const [frequency, setFrequency] = useState<PromotionFrequency>(popup?.frequency ?? "once_per_session");
  const [audience, setAudience] = useState<PromotionAudience>(popup?.audience ?? "all");
  const [priority, setPriority] = useState(popup?.priority ?? 0);
  const [isActive, setIsActive] = useState(popup?.isActive ?? false);
  const [isPrimary, setIsPrimary] = useState(popup?.isPrimary ?? false);
  const [startsAt, setStartsAt] = useState(toUtcInput(popup?.startsAt));
  const [endsAt, setEndsAt] = useState(toUtcInput(popup?.endsAt));
  const [pageTargets, setPageTargets] = useState<PromotionPageTarget[]>(popup?.displayConfig.pageTargets ?? [...DEFAULT_PROMOTION_DISPLAY.pageTargets]);
  const [customPaths, setCustomPaths] = useState((popup?.displayConfig.customPaths ?? []).join("\n"));
  const [showPreview, setShowPreview] = useState(true);
  const [clientError, setClientError] = useState("");
  const errors = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.status === "success") toast.success(state.message || "Popup berhasil disimpan.");
    if (state.status === "error") toast.error(state.message || "Popup gagal disimpan.");
  }, [state]);

  const previewPopup = useMemo<PromotionPopupAdmin>(() => ({
    id: popup?.id ?? "preview",
    internalName: popup?.internalName ?? "",
    title,
    description,
    imagePath: imagePath || null,
    imageUrl: imageUrl || null,
    imageAlt: imagePath ? imageAlt || null : null,
    primaryButtonText: primaryText || null,
    primaryButtonUrl: primaryUrl || null,
    secondaryButtonText: secondaryText || null,
    secondaryButtonUrl: secondaryUrl || null,
    stylingConfig: { backgroundColor, textColor, buttonColor, buttonTextColor, position, size, backdropClose },
    displayConfig: { pageTargets, customPaths: customPaths.split(/\r?\n/).map((path) => path.trim()).filter(Boolean) },
    popupType,
    frequency,
    audience,
    priority,
    isPrimary,
    isActive,
    startsAt: startsAt ? new Date(`${startsAt}:00Z`).toISOString() : new Date().toISOString(),
    endsAt: endsAt ? new Date(`${endsAt}:00Z`).toISOString() : null,
    createdAt: popup?.createdAt ?? "",
    updatedAt: popup?.updatedAt ?? "",
  }), [
    popup, title, description, imagePath, imageUrl, imageAlt, primaryText, primaryUrl,
    secondaryText, secondaryUrl, backgroundColor, textColor, buttonColor, buttonTextColor,
    position, size, backdropClose, pageTargets, customPaths, popupType, frequency,
    audience, priority, isPrimary, isActive, startsAt, endsAt,
  ]);

  function toggleTarget(target: PromotionPageTarget, checked: boolean) {
    setPageTargets((current) => {
      const next = checked
        ? Array.from(new Set([...current, target]))
        : current.filter((item) => item !== target);
      if (target === "custom" && !checked) setCustomPaths("");
      return next;
    });
  }

  function validateBeforeSubmit(event: FormEvent<HTMLFormElement>) {
    const parsed = parsePromotionalPopupForm(new FormData(event.currentTarget));
    if (!parsed.success) {
      event.preventDefault();
      const message = parsed.error.issues[0]?.message ?? "Periksa kembali konfigurasi popup.";
      setClientError(message);
      toast.error(message);
      return;
    }
    setClientError("");
  }

  return (
    <form action={formAction} className="space-y-5" noValidate onSubmit={validateBeforeSubmit} onChange={() => { if (clientError) setClientError(""); }}>
      {popup ? <input type="hidden" name="popupId" value={popup.id} /> : null}
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
        <div className="space-y-4">
          <section className="rounded-[8px] border border-line bg-surface p-4 sm:p-5" aria-labelledby="popup-copy-heading">
            <div className="mb-4 border-b border-line pb-3">
              <h2 id="popup-copy-heading" className="font-display text-base font-semibold text-ink">Konten popup</h2>
              <p className="mt-0.5 text-[11px] text-muted">Konten disimpan sebagai konfigurasi Supabase; tidak ada copy promosi yang ditanam di komponen.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Nama internal" htmlFor="internalName" error={errors.internalName} hint="Untuk pengelolaan dan log audit; tidak ditampilkan kepada pengunjung." className="sm:col-span-2">
                <Input id="internalName" name="internalName" defaultValue={popup?.internalName ?? ""} required maxLength={100} placeholder="mis. campaign-oktober" />
              </FormField>
              <FormField label="Judul" htmlFor="popupTitle" error={errors.title} className="sm:col-span-2">
                <Input id="popupTitle" name="title" value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={120} />
              </FormField>
              <FormField label="Deskripsi" htmlFor="popupDescription" error={errors.description} hint="Opsional, maksimal 1.200 karakter." className="sm:col-span-2">
                <Textarea id="popupDescription" name="description" value={description} onChange={(event) => setDescription(event.target.value)} rows={4} maxLength={1200} />
              </FormField>
              <FormField label="Banner popup" htmlFor="popup-image-upload" error={errors.imagePath} hint="Opsional. Gambar dikompresi ke WebP dan dibatasi 5 MB setelah optimasi." className="sm:col-span-2">
                <StorageImageUpload
                  bucket="promotion-assets"
                  id="popup-image-upload"
                  name="imagePath"
                  label="Banner popup 16:9"
                  fileNameBase={popup?.internalName || title || "popup"}
                  path={imagePath}
                  publicUrl={imageUrl}
                  altText={imageAlt}
                  helper="JPG, PNG, WebP, atau AVIF. Gunakan gambar yang relevan dan beri alt text deskriptif."
                  error={errors.imagePath}
                  onChange={(path, url) => {
                    setImagePath(path);
                    setImageUrl(url);
                    if (!path) setImageAlt("");
                  }}
                />
              </FormField>
              <FormField label="Alt text banner" htmlFor="popupImageAlt" error={errors.imageAlt} className="sm:col-span-2">
                <Input id="popupImageAlt" name="imageAlt" value={imageAlt} onChange={(event) => setImageAlt(event.target.value)} maxLength={180} required={Boolean(imagePath)} placeholder="Deskripsikan isi gambar secara singkat" />
              </FormField>
            </div>
          </section>

          <section className="rounded-[8px] border border-line bg-surface p-4 sm:p-5" aria-labelledby="popup-cta-heading">
            <div className="mb-4 border-b border-line pb-3">
              <h2 id="popup-cta-heading" className="font-display text-base font-semibold text-ink">Tombol ajakan</h2>
              <p className="mt-0.5 text-[11px] text-muted">Gunakan path LearnCode seperti /courses atau URL HTTP(S) tepercaya. Tautan eksternal dibuka dengan rel aman.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Label tombol utama" htmlFor="primaryButtonText" error={errors.primaryButtonText}>
                <Input id="primaryButtonText" name="primaryButtonText" value={primaryText} onChange={(event) => setPrimaryText(event.target.value)} maxLength={60} />
              </FormField>
              <FormField label="URL tombol utama" htmlFor="primaryButtonUrl" error={errors.primaryButtonUrl}>
                <Input id="primaryButtonUrl" name="primaryButtonUrl" value={primaryUrl} onChange={(event) => setPrimaryUrl(event.target.value)} maxLength={2048} placeholder="/courses atau https://…" />
              </FormField>
              <FormField label="Label tombol sekunder" htmlFor="secondaryButtonText" error={errors.secondaryButtonText}>
                <Input id="secondaryButtonText" name="secondaryButtonText" value={secondaryText} onChange={(event) => setSecondaryText(event.target.value)} maxLength={60} />
              </FormField>
              <FormField label="URL tombol sekunder" htmlFor="secondaryButtonUrl" error={errors.secondaryButtonUrl}>
                <Input id="secondaryButtonUrl" name="secondaryButtonUrl" value={secondaryUrl} onChange={(event) => setSecondaryUrl(event.target.value)} maxLength={2048} placeholder="/blog atau https://…" />
              </FormField>
            </div>
          </section>

          <section className="rounded-[8px] border border-line bg-surface p-4 sm:p-5" aria-labelledby="popup-behavior-heading">
            <div className="mb-4 border-b border-line pb-3">
              <h2 id="popup-behavior-heading" className="font-display text-base font-semibold text-ink">Penayangan dan penjadwalan</h2>
              <p className="mt-0.5 text-[11px] text-muted">Simpan waktu jadwal dalam UTC. Popup yang tidak aktif atau di luar jadwal tidak akan dipilih publik.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Jenis popup" htmlFor="popupType" error={errors.popupType}>
                <Select id="popupType" name="popupType" value={popupType} onChange={(event) => setPopupType(event.target.value as PromotionType)}>
                  {PROMOTION_TYPES.map((type) => <option key={type} value={type}>{TYPE_LABELS[type]}</option>)}
                </Select>
              </FormField>
              <FormField label="Frekuensi" htmlFor="frequency" error={errors.frequency} hint={frequency === "once_per_user" ? "Hanya untuk audience pengguna yang sudah masuk." : undefined}>
                <Select id="frequency" name="frequency" value={frequency} onChange={(event) => {
                  const nextFrequency = event.target.value as PromotionFrequency;
                  setFrequency(nextFrequency);
                  if (nextFrequency === "once_per_user") setAudience("authenticated");
                }}>
                  {PROMOTION_FREQUENCIES.map((value) => <option key={value} value={value}>{FREQUENCY_LABELS[value]}</option>)}
                </Select>
              </FormField>
              <FormField label="Audience" htmlFor="audience" error={errors.audience}>
                <Select id="audience" name="audience" value={audience} onChange={(event) => setAudience(event.target.value as PromotionAudience)}>
                  {PROMOTION_AUDIENCES.map((value) => <option key={value} value={value}>{AUDIENCE_LABELS[value]}</option>)}
                </Select>
              </FormField>
              <FormField label="Prioritas" htmlFor="priority" error={errors.priority} hint="Angka lebih besar dipilih lebih dahulu jika beberapa popup sama-sama cocok.">
                <Input id="priority" name="priority" type="number" min={0} max={10000} step={1} value={priority} onChange={(event) => setPriority(Number(event.target.value))} />
              </FormField>
              <FormField label="Mulai (UTC)" htmlFor="startsAt" error={errors.startsAt} hint="Kosong berarti mulai sekarang.">
                <Input id="startsAt" name="startsAt" type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} />
              </FormField>
              <FormField label="Berakhir (UTC)" htmlFor="endsAt" error={errors.endsAt} hint="Kosong berarti tanpa tanggal akhir.">
                <Input id="endsAt" name="endsAt" type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} />
              </FormField>
              <fieldset className="space-y-1.5 sm:col-span-2">
                <legend className="block text-[0.8125rem] font-medium text-ink">Target halaman</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {PROMOTION_PAGE_TARGETS.map((target) => (
                    <label key={target} className="flex min-h-10 items-center gap-2 rounded-[5px] border border-line px-3 py-2 text-xs text-ink-soft">
                      <input
                        type="checkbox"
                        name="pageTargets"
                        value={target}
                        checked={pageTargets.includes(target)}
                        onChange={(event) => toggleTarget(target, event.target.checked)}
                        className="size-4 accent-[var(--lc-accent-text)]"
                      />
                      {TARGET_LABELS[target]}
                    </label>
                  ))}
                </div>
                {errors.pageTargets?.length ? <p className="text-[11px] text-danger" role="alert">{errors.pageTargets.join(" ")}</p> : null}
              </fieldset>
              {pageTargets.includes("custom") ? (
                <FormField label="Path khusus" htmlFor="customPaths" error={errors.customPaths} hint="Satu path per baris; gunakan * hanya di akhir, mis. /promo/*." className="sm:col-span-2">
                  <Textarea id="customPaths" name="customPaths" value={customPaths} onChange={(event) => setCustomPaths(event.target.value)} rows={3} maxLength={3200} placeholder="/promo/*" />
                </FormField>
              ) : <input type="hidden" name="customPaths" value="" />}
            </div>
            <div className="mt-4 grid gap-2 border-t border-line pt-4 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-xs text-ink-soft">
                <input type="checkbox" name="isActive" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} className="size-4 accent-[var(--lc-accent-text)]" />
                Aktifkan popup sesuai jadwal
              </label>
              <label className="flex items-center gap-2 text-xs text-ink-soft">
                <input type="checkbox" name="isPrimary" checked={isPrimary} onChange={(event) => setIsPrimary(event.target.checked)} className="size-4 accent-[var(--lc-accent-text)]" />
                Jadikan popup utama
              </label>
              <label className="flex items-center gap-2 text-xs text-ink-soft sm:col-span-2">
                <input type="checkbox" name="backdropClose" checked={backdropClose} onChange={(event) => setBackdropClose(event.target.checked)} className="size-4 accent-[var(--lc-accent-text)]" />
                Izinkan menutup dengan klik area backdrop
              </label>
            </div>
          </section>

          <section className="rounded-[8px] border border-line bg-surface p-4 sm:p-5" aria-labelledby="popup-style-heading">
            <div className="mb-4 border-b border-line pb-3">
              <h2 id="popup-style-heading" className="font-display text-base font-semibold text-ink">Gaya tampilan</h2>
              <p className="mt-0.5 text-[11px] text-muted">Pilih warna kontras dan tata letak yang nyaman dibaca.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField label="Warna panel" htmlFor="backgroundColor" error={errors.backgroundColor}>
                <Input id="backgroundColor" name="backgroundColor" type="color" value={backgroundColor} onChange={(event) => setBackgroundColor(event.target.value)} />
              </FormField>
              <FormField label="Warna teks" htmlFor="textColor" error={errors.textColor}>
                <Input id="textColor" name="textColor" type="color" value={textColor} onChange={(event) => setTextColor(event.target.value)} />
              </FormField>
              <FormField label="Warna tombol" htmlFor="buttonColor" error={errors.buttonColor}>
                <Input id="buttonColor" name="buttonColor" type="color" value={buttonColor} onChange={(event) => setButtonColor(event.target.value)} />
              </FormField>
              <FormField label="Teks tombol" htmlFor="buttonTextColor" error={errors.buttonTextColor}>
                <Input id="buttonTextColor" name="buttonTextColor" type="color" value={buttonTextColor} onChange={(event) => setButtonTextColor(event.target.value)} />
              </FormField>
              <FormField label="Posisi" htmlFor="position" error={errors.position}>
                <Select id="position" name="position" value={position} onChange={(event) => setPosition(event.target.value as typeof position)}>
                  {PROMOTION_POSITIONS.map((value) => <option key={value} value={value}>{value === "center" ? "Tengah" : value === "bottom_right" ? "Bawah kanan" : "Bawah kiri"}</option>)}
                </Select>
              </FormField>
              <FormField label="Ukuran" htmlFor="size" error={errors.size}>
                <Select id="size" name="size" value={size} onChange={(event) => setSize(event.target.value as typeof size)}>
                  {PROMOTION_SIZES.map((value) => <option key={value} value={value}>{value === "compact" ? "Ringkas" : value === "normal" ? "Normal" : "Lebar"}</option>)}
                </Select>
              </FormField>
            </div>
          </section>

          {clientError ? <FormMessage status="error" message={clientError} /> : null}
          <FormMessage status={state.status} message={state.message} />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <p className="max-w-xl text-[11px] leading-relaxed text-muted">Perubahan akses admin diperiksa ulang di server dan dicatat pada log audit.</p>
            <Button type="submit" loading={pending}>
              <Save aria-hidden="true" />
              {popup ? "Simpan perubahan" : "Buat popup"}
            </Button>
          </div>
        </div>

        <aside className="space-y-3 xl:sticky xl:top-5" aria-labelledby="popup-preview-heading">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 id="popup-preview-heading" className="font-display text-base font-semibold text-ink">Pratinjau langsung</h2>
              <p className="mt-0.5 text-[11px] text-muted">Berubah saat konten dan gaya diedit.</p>
            </div>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowPreview((value) => !value)} aria-expanded={showPreview}>
              <Eye aria-hidden="true" /> {showPreview ? "Sembunyikan" : "Tampilkan"}
            </Button>
          </div>
          {showPreview ? <PromotionPopupLivePreview popup={previewPopup} /> : null}
          <div className="rounded-[6px] border border-line bg-surface px-3 py-2.5 text-[11px] leading-relaxed text-muted">
            <span className="font-medium text-ink-soft">Prioritas {priority}</span> · {AUDIENCE_LABELS[audience]} · {FREQUENCY_LABELS[frequency]}
            {isPrimary ? <span className="ml-1 font-medium text-accent-text">· Popup utama</span> : null}
          </div>
          <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted">
            <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-accent-text" aria-hidden="true" />
            Tautan eksternal dibuka di tab baru. Preview ini tidak mengaktifkan CTA.
          </p>
        </aside>
      </div>
    </form>
  );
}
