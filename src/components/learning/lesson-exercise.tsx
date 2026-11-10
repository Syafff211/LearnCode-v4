import { FlaskConical, Lightbulb } from "lucide-react";

import { CodeWorkspace } from "@/components/playground/code-workspace";
import type { LearningLesson } from "@/lib/data/learning";

/**
 * Lesson exercise. The starter files come from the database; the editor runs
 * entirely in the browser inside a sandboxed iframe (no backend execution).
 */
export function LessonExercise({
  exercise,
  lessonTitle,
}: {
  exercise: LearningLesson["exercise"];
  lessonTitle: string;
}) {
  const starter = {
    html: exercise.starter?.html ?? "",
    css: exercise.starter?.css ?? "",
    js: exercise.starter?.js ?? "",
  };
  if (!exercise.title || (!starter.html && !starter.css && !starter.js)) return null;

  const steps = Array.isArray(exercise.steps) ? exercise.steps.filter(Boolean) : [];

  return (
    <section aria-labelledby="latihan-heading" className="mt-12">
      <div className="flex flex-wrap items-center gap-2">
        <span className="eyebrow">Latihan</span>
        <span className="font-mono text-[10px] text-muted">editor di browser</span>
      </div>
      <h2 id="latihan-heading" className="display-title mt-2">
        {exercise.title}
      </h2>
      <p className="mt-3 max-w-[68ch] text-sm leading-relaxed text-ink-soft">{exercise.brief}</p>

      {steps.length > 0 ? (
        <ol className="mt-5 max-w-[68ch] space-y-2">
          {steps.map((step, index) => (
            <li key={index} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
              <span
                className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-line-strong font-mono text-[10px] text-muted"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      ) : null}

      <div className="mt-5 overflow-hidden rounded-[8px] border border-line bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2">
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
            <FlaskConical className="size-3" aria-hidden="true" />
            Latihan: {lessonTitle}
          </span>
          <span className="font-mono text-[10px] text-muted">perubahan tidak dikirim ke server</span>
        </div>
        <CodeWorkspace
          key={lessonTitle}
          initialFiles={starter}
          editorHeight="h-[260px] sm:h-[320px] lg:h-[380px]"
        />
      </div>

      {exercise.hint ? (
        <details className="group mt-4 rounded-[6px] border border-line bg-surface-2/60 px-4 py-3">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-medium text-ink-soft marker:hidden">
            <Lightbulb className="size-3.5 text-highlight" aria-hidden="true" />
            Buka hint
            <span className="ml-auto font-mono text-[10px] text-muted group-open:hidden">
              opsional
            </span>
          </summary>
          <p className="mt-2 max-w-[68ch] text-sm leading-relaxed text-ink-soft">{exercise.hint}</p>
        </details>
      ) : null}

      <p className="mt-3 text-[11px] leading-relaxed text-muted">
        Preview berjalan di iframe dengan sandbox <code className="font-mono">allow-scripts</code>{" "}
        saja. Tidak ada kode yang dieksekusi di server dan tidak ada data yang dikirim ke luar
        browser untuk latihan ini.
      </p>
    </section>
  );
}
