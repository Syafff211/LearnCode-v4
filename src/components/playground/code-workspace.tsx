"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { loader, type Monaco } from "@monaco-editor/react";
import { AlertTriangle, Play, RotateCcw, Save, Terminal, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { buildPreviewDocument, isValidConsoleMessage, type ConsoleEntry, type PlaygroundFiles } from "@/lib/playground";
import { cn } from "@/lib/utils";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-code-bg">
      <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
        Memuat editor…
      </span>
    </div>
  ),
});

type FileKey = keyof PlaygroundFiles;

const tabs: { key: FileKey; label: string; language: string; id: string }[] = [
  { key: "html", label: "HTML", language: "html", id: "tab-html" },
  { key: "css", label: "CSS", language: "css", id: "tab-css" },
  { key: "js", label: "JS", language: "javascript", id: "tab-js" },
];

if (typeof window !== "undefined") {
  loader.config({ paths: { vs: "/monaco/vs" } });
}

const STORAGE_KEY = "learncode-playground-v1";

type SavedProject = {
  files: PlaygroundFiles;
  savedAt: string;
};

function defineThemes(monaco: Monaco) {
  monaco.editor.defineTheme("learncode-light", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "comment", foreground: "8A877D", fontStyle: "italic" },
      { token: "keyword", foreground: "1E4C3D" },
      { token: "string", foreground: "7A5310" },
      { token: "tag", foreground: "1E4C3D" },
      { token: "attribute.name", foreground: "7A5310" },
      { token: "attribute.value", foreground: "3F5E4C" },
      { token: "number", foreground: "8A4B1E" },
    ],
    colors: {
      "editor.background": "#F5F2E9",
      "editor.foreground": "#26251F",
      "editorLineNumber.foreground": "#A8A296",
      "editorLineNumber.activeForeground": "#4A473E",
      "editor.selectionBackground": "#DDE8E1",
      "editor.lineHighlightBackground": "#ECE8DC",
      "editorCursor.foreground": "#1E4C3D",
      "editorIndentGuide.background1": "#E2DDD0",
    },
  });
  monaco.editor.defineTheme("learncode-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "8F8B7F", fontStyle: "italic" },
      { token: "keyword", foreground: "A9CFB9" },
      { token: "string", foreground: "E0B369" },
      { token: "tag", foreground: "A9CFB9" },
      { token: "attribute.name", foreground: "E0B369" },
      { token: "attribute.value", foreground: "B9D4C4" },
      { token: "number", foreground: "E2A176" },
    ],
    colors: {
      "editor.background": "#171814",
      "editor.foreground": "#EDEADF",
      "editorLineNumber.foreground": "#5C5D52",
      "editorLineNumber.activeForeground": "#B3AFA3",
      "editor.selectionBackground": "#2C4437",
      "editor.lineHighlightBackground": "#1F241D",
      "editorCursor.foreground": "#A9CFB9",
      "editorIndentGuide.background1": "#2A2B24",
    },
  });
}

function readSavedProject(): SavedProject | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedProject>;
    if (
      parsed.files &&
      typeof parsed.files.html === "string" &&
      typeof parsed.files.css === "string" &&
      typeof parsed.files.js === "string"
    ) {
      return {
        files: parsed.files,
        savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : "",
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function CodeWorkspace({
  initialFiles,
  allowSave = false,
  className,
  editorHeight = "h-[300px] sm:h-[380px] lg:h-[440px]",
}: {
  initialFiles: PlaygroundFiles;
  allowSave?: boolean;
  className?: string;
  editorHeight?: string;
}) {
  const { resolvedTheme } = useTheme();
  const [files, setFiles] = React.useState<PlaygroundFiles>(initialFiles);
  const [activeTab, setActiveTab] = React.useState<FileKey>("html");
  const [renderedFiles, setRenderedFiles] = React.useState<PlaygroundFiles>(initialFiles);
  const [iframeKey, setIframeKey] = React.useState(0);
  const [entries, setEntries] = React.useState<ConsoleEntry[]>([]);
  const [saved, setSaved] = React.useState<SavedProject | null>(null);
  const [announcement, setAnnouncement] = React.useState("");
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);

  React.useEffect(() => {
    // localStorage is only readable after hydration. The "saved project" badge
    // is intentionally not part of the server HTML, so this value cannot be
    // derived during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaved(readSavedProject());
  }, []);

  React.useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) return;
      if (!isValidConsoleMessage(event.data)) return;
      setEntries((current) => [
        ...current.slice(-49),
        { level: event.data.level, text: event.data.text, time: Date.now() },
      ]);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const srcDoc = React.useMemo(() => buildPreviewDocument(renderedFiles), [renderedFiles]);
  const errorCount = entries.filter((entry) => entry.level === "error").length;
  const dirty = tabs.some((tab) => files[tab.key] !== renderedFiles[tab.key]);

  function run() {
    setEntries([]);
    setRenderedFiles({ ...files });
    setIframeKey((key) => key + 1);
    setAnnouncement("Kode dijalankan. Preview dan console diperbarui.");
  }

  function reset() {
    const changed = tabs.some((tab) => files[tab.key] !== initialFiles[tab.key]);
    if (changed && !window.confirm("Kembalikan kode ke contoh awal? Perubahan kamu akan hilang.")) {
      return;
    }
    setFiles(initialFiles);
    setRenderedFiles(initialFiles);
    setIframeKey((key) => key + 1);
    setEntries([]);
    setAnnouncement("Kode dikembalikan ke contoh awal.");
    toast.success("Kode direset ke contoh awal.");
  }

  function saveProject() {
    try {
      const project: SavedProject = { files, savedAt: new Date().toISOString() };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
      setSaved(project);
      toast.success("Tersimpan di browser ini", {
        description: "Proyek playground disimpan di localStorage perangkat, bukan di akunmu.",
      });
    } catch {
      toast.error("Penyimpanan browser tidak tersedia");
    }
  }

  function loadProject() {
    const project = readSavedProject();
    if (!project) {
      toast.error("Belum ada proyek tersimpan di browser ini");
      return;
    }
    setFiles(project.files);
    setRenderedFiles(project.files);
    setIframeKey((key) => key + 1);
    setEntries([]);
    setAnnouncement("Proyek tersimpan dimuat ke editor.");
    toast.success("Proyek tersimpan dimuat");
  }

  return (
    <div className={cn("overflow-hidden rounded-[8px] border border-line bg-surface", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-2 py-1.5">
        <div role="tablist" aria-label="Berkas kode" className="flex items-center gap-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              id={tab.id}
              aria-selected={activeTab === tab.key}
              aria-controls="editor-panel"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "rounded-[4px] px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text",
                activeTab === tab.key
                  ? "bg-surface-2 text-ink"
                  : "text-muted hover:text-ink",
              )}
            >
              {tab.label}
            </button>
          ))}
          {dirty ? (
            <span className="ml-1.5 font-mono text-[9px] uppercase tracking-[0.06em] text-highlight">
              belum dijalankan
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {allowSave ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={loadProject}
                disabled={!saved}
                title={saved ? "Muat proyek dari browser ini" : "Belum ada proyek tersimpan"}
              >
                Muat
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={saveProject}>
                <Save aria-hidden="true" />
                Simpan
              </Button>
            </>
          ) : null}
          <Button type="button" variant="secondary" size="sm" onClick={reset}>
            <RotateCcw aria-hidden="true" />
            Reset
          </Button>
          <Button type="button" size="sm" onClick={run}>
            <Play aria-hidden="true" />
            Run
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2">
        <div
          id="editor-panel"
          role="tabpanel"
          aria-labelledby={tabs.find((tab) => tab.key === activeTab)?.id}
          className={cn("min-w-0 border-b border-line lg:border-b-0 lg:border-r", editorHeight)}
        >
          <MonacoEditor
            height="100%"
            language={tabs.find((tab) => tab.key === activeTab)?.language ?? "html"}
            path={`learncode-${activeTab}.${activeTab === "js" ? "js" : activeTab === "css" ? "css" : "html"}`}
            value={files[activeTab]}
            onChange={(value) =>
              setFiles((current) => ({ ...current, [activeTab]: value ?? "" }))
            }
            beforeMount={(monaco) => defineThemes(monaco)}
            theme={resolvedTheme === "dark" ? "learncode-dark" : "learncode-light"}
            loading={
              <div className="flex h-full items-center justify-center bg-code-bg">
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
                  Memuat editor…
                </span>
              </div>
            }
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily:
                '"JetBrains Mono Variable", ui-monospace, SFMono-Regular, Menlo, monospace',
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: "on",
              padding: { top: 12, bottom: 12 },
              renderLineHighlight: "line",
              smoothScrolling: true,
              cursorBlinking: "smooth",
              ariaLabel: `Editor kode ${activeTab.toUpperCase()}`,
            }}
        />
        </div>

        <div className="flex min-w-0 flex-col">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
              Output · iframe tersandbox
            </span>
            {errorCount > 0 ? (
              <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.06em] text-danger">
                <AlertTriangle className="size-3" aria-hidden="true" />
                {errorCount} error
              </span>
            ) : (
              <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-ok">
                allow-scripts
              </span>
            )}
          </div>
          <div className={cn("bg-white", editorHeight)}>
            <iframe
              key={iframeKey}
              ref={iframeRef}
              title="Preview kode HTML, CSS, dan JavaScript"
              sandbox="allow-scripts"
              referrerPolicy="no-referrer"
              srcDoc={srcDoc}
              className="h-full w-full border-0"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-line bg-surface-2/60">
        <div className="flex items-center justify-between px-3 py-1.5">
          <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
            <Terminal className="size-3" aria-hidden="true" />
            Console
            {entries.length > 0 ? ` · ${entries.length}` : ""}
          </span>
          <button
            type="button"
            onClick={() => setEntries([])}
            disabled={entries.length === 0}
            className="inline-flex items-center gap-1 rounded-[3px] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.06em] text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text disabled:opacity-40"
          >
            <Trash2 className="size-3" aria-hidden="true" />
            Bersihkan
          </button>
        </div>
        <div
          role="log"
          aria-live="polite"
          aria-label="Keluaran console"
          className="max-h-24 min-h-[3.25rem] overflow-y-auto border-t border-line bg-code-bg px-3 py-2 font-mono text-[11px] leading-relaxed"
        >
          {entries.length === 0 ? (
            <p className="text-muted">
              Console kosong. Gunakan <span className="text-ink-soft">console.log()</span> untuk
              melihat nilai.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {entries.map((entry, index) => (
                <li
                  key={`${entry.time}-${index}`}
                  className={cn(
                    "flex gap-2",
                    entry.level === "error"
                      ? "text-danger"
                      : entry.level === "warn"
                        ? "text-highlight"
                        : "text-ink-soft",
                  )}
                >
                  <span className="shrink-0 uppercase text-muted/70">{entry.level}</span>
                  <span className="break-words whitespace-pre-wrap">{entry.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
