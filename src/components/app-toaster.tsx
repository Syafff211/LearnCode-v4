"use client";

import { Toaster } from "sonner";

import { useTheme } from "@/components/theme-provider";

export function AppToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      theme={resolvedTheme}
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "!bg-surface !text-ink !border !border-line !rounded-[6px] !shadow-[0_6px_24px_rgb(25_24_20/0.10)] !font-sans",
          description: "!text-muted",
          actionButton: "!bg-accent !text-accent-ink",
          cancelButton: "!bg-surface-2 !text-ink",
        },
      }}
    />
  );
}
