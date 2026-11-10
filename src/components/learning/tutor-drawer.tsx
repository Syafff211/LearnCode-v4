"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";

import { TutorChat } from "@/components/ai/tutor-chat";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function TutorDrawer({
  lessonId,
  lessonTitle,
  lessonCodeLanguage = "html",
  defaultLanguage,
  initialUsed,
  dailyLimit,
  aiConfigured,
}: {
  lessonId: string;
  lessonTitle: string;
  lessonCodeLanguage?: "html" | "css" | "javascript";
  defaultLanguage: "id" | "en";
  initialUsed: number;
  dailyLimit: number;
  aiConfigured: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [selectedCode, setSelectedCode] = React.useState("");
  const [selectedCodeLanguage, setSelectedCodeLanguage] = React.useState(lessonCodeLanguage);
  const selectionOnPointerDown = React.useRef("");

  function captureCodeSelection() {
    const selection = window.getSelection();
    const selected = selection?.toString().trim() ?? "";
    const anchor = selection?.anchorNode;
    const parent = anchor instanceof Element ? anchor : anchor?.parentElement;
    const inCode = Boolean(parent?.closest("pre, code"));
    selectionOnPointerDown.current = inCode ? selected.slice(0, 8000) : "";
  }

  function openTutor() {
    if (!selectionOnPointerDown.current) captureCodeSelection();
    setSelectedCode(selectionOnPointerDown.current);
    selectionOnPointerDown.current = "";
    setSelectedCodeLanguage(lessonCodeLanguage);
    setOpen(true);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        aria-haspopup="dialog"
        onPointerDown={captureCodeSelection}
        onClick={openTutor}
      >
        <Sparkles aria-hidden="true" />
        AI Tutor
      </Button>
      <DialogContent
        className="left-auto right-0 top-0 h-dvh w-full max-w-none translate-x-0 translate-y-0 gap-0 rounded-none border-y-0 border-r-0 p-0 sm:w-[26rem] lg:w-[30rem]"
        hideClose
      >
        <DialogTitle className="sr-only">AI Tutor untuk lesson {lessonTitle}</DialogTitle>
        <div className="h-full pt-1">
          <TutorChat
            embedded
            fixedLesson={{ id: lessonId, title: lessonTitle }}
            defaultLanguage={defaultLanguage}
            initialUsed={initialUsed}
            dailyLimit={dailyLimit}
            aiConfigured={aiConfigured}
            initialCode={selectedCode}
            initialCodeLanguage={selectedCodeLanguage}
            autoFocus
            onClose={() => setOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
