"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { FormField, FormMessage } from "@/components/admin/primitives";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { IDLE_ADMIN_STATE, type AdminActionState } from "@/lib/actions/admin-state";

const OPTION_IDS = ["a", "b", "c", "d", "e", "f"];

type Option = { id: string; text: string };

type QuestionInitial = {
  id: string;
  quizId: string;
  prompt: string;
  code: string;
  codeLanguage: string;
  options: Option[];
  correctOptionId: string;
  explanation: string;
  weight: number;
};

export function QuestionForm({
  action,
  quizId,
  question,
  cancelHref,
}: {
  action: (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;
  quizId: string;
  question?: QuestionInitial;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_ADMIN_STATE);
  const errors = state.fieldErrors ?? {};
  const isEdit = Boolean(question);

  const [options, setOptions] = useState<Option[]>(
    question?.options && question.options.length > 0
      ? question.options
      : [
          { id: "a", text: "" },
          { id: "b", text: "" },
          { id: "c", text: "" },
          { id: "d", text: "" },
        ],
  );
  const [correct, setCorrect] = useState(question?.correctOptionId ?? "a");

  const updateOption = (index: number, text: string) => {
    setOptions((current) => current.map((option, i) => (i === index ? { ...option, text } : option)));
  };

  const removeOption = (index: number) => {
    setOptions((current) => {
      if (current.length <= 2) return current;
      const next = current.filter((_, i) => i !== index);
      if (!next.some((option) => option.id === correct)) setCorrect(next[0]?.id ?? "a");
      return next;
    });
  };

  const addOption = () => {
    setOptions((current) => {
      if (current.length >= OPTION_IDS.length) return current;
      const nextId = OPTION_IDS.find((id) => !current.some((option) => option.id === id)) ?? "f";
      return [...current, { id: nextId, text: "" }];
    });
  };

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="quizId" value={quizId} />
      {isEdit ? <input type="hidden" name="questionId" value={question?.id} /> : null}

      <div className="rounded-[8px] border border-line bg-surface p-4 sm:p-5">
        <h2 className="font-display text-base font-semibold text-ink">Pertanyaan</h2>
        <div className="mt-4 space-y-4">
          <FormField label="Teks pertanyaan" htmlFor="prompt" error={errors.prompt}>
            <Textarea id="prompt" name="prompt" defaultValue={question?.prompt} rows={3} required maxLength={1000} />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Bahasa kode" htmlFor="codeLanguage" error={errors.codeLanguage}>
              <Select id="codeLanguage" name="codeLanguage" defaultValue={question?.codeLanguage || "html"}>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="javascript">JavaScript</option>
              </Select>
            </FormField>
            <FormField
              label="Bobot nilai"
              htmlFor="weight"
              error={errors.weight}
              hint="1–10. Hanya berlaku untuk percobaan berikutnya."
              className="sm:col-span-2"
            >
              <Input id="weight" name="weight" type="number" min={1} max={10} defaultValue={question?.weight ?? 1} required />
            </FormField>
          </div>

          <FormField
            label="Potongan kode (opsional)"
            htmlFor="code"
            error={errors.code}
            hint="Ditampilkan sebagai blok kode di atas pilihan jawaban."
          >
            <Textarea
              id="code"
              name="code"
              defaultValue={question?.code}
              rows={5}
              className="font-mono text-[0.8125rem] leading-relaxed"
            />
          </FormField>
        </div>
      </div>

      <div className="rounded-[8px] border border-line bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-semibold text-ink">Pilihan jawaban</h2>
            <p className="text-[11px] text-muted">Pilih satu jawaban benar. Kunci jawaban hanya dipakai server.</p>
          </div>
          <Button type="button" size="sm" variant="secondary" onClick={addOption} disabled={options.length >= 6}>
            <Plus aria-hidden="true" />
            Tambah opsi
          </Button>
        </div>

        {errors.options ? (
          <p role="alert" className="mt-2 text-[11px] text-danger">
            {errors.options.join(" ")}
          </p>
        ) : null}

        <div className="mt-3 space-y-2">
          {options.map((option, index) => (
            <div key={option.id} className="flex items-center gap-2">
              <input type="hidden" name={`optionId-${index}`} value={option.id} />
              <input
                type="radio"
                name="correctOptionId"
                value={option.id}
                checked={correct === option.id}
                onChange={() => setCorrect(option.id)}
                aria-label={`Tandai opsi ${option.id.toUpperCase()} sebagai jawaban benar`}
                className="size-4 shrink-0 accent-[color:var(--lc-accent)]"
              />
              <Input
                name={`option-${index}`}
                value={option.text}
                onChange={(event) => updateOption(index, event.target.value)}
                placeholder={`Opsi ${option.id.toUpperCase()}`}
                maxLength={300}
                className="h-9 text-[0.8125rem]"
              />
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={() => removeOption(index)}
                disabled={options.length <= 2}
                aria-label={`Hapus opsi ${option.id.toUpperCase()}`}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
          ))}
        </div>
        {errors.correctOptionId ? (
          <p role="alert" className="mt-2 text-[11px] text-danger">
            {errors.correctOptionId.join(" ")}
          </p>
        ) : null}
      </div>

      <div className="rounded-[8px] border border-line bg-surface p-4 sm:p-5">
        <FormField
          label="Penjelasan jawaban"
          htmlFor="explanation"
          error={errors.explanation}
          hint="Ditampilkan setelah peserta mengumpulkan jawaban."
        >
          <Textarea id="explanation" name="explanation" defaultValue={question?.explanation} rows={3} required maxLength={1000} />
        </FormField>
      </div>

      <FormMessage status={state.status} message={state.message} />

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" loading={pending}>
          {isEdit ? "Simpan pertanyaan" : "Tambah pertanyaan"}
        </Button>
        <Button asChild variant="ghost" type="button">
          <Link href={cancelHref}>Batal</Link>
        </Button>
      </div>
    </form>
  );
}
