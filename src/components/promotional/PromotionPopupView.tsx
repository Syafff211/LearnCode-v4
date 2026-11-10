"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from "react";

import type { PromotionPopupPublic } from "@/lib/promotional-popup";

function PromotionLink({
  href,
  children,
  className,
  onActivate,
}: {
  href: string;
  children: React.ReactNode;
  className: string;
  onActivate: () => void;
}) {
  if (href.startsWith("/") && !href.startsWith("//")) {
    return (
      <Link href={href} onClick={onActivate} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={onActivate} className={className}>
      {children}
    </a>
  );
}

export function PromotionPopupView({
  popup,
  onClose,
  preview = false,
}: {
  popup: PromotionPopupPublic;
  onClose: () => void;
  preview?: boolean;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const [closing, setClosing] = useState(false);

  function requestClose() {
    if (closing) return;
    setClosing(true);
    closeTimeoutRef.current = window.setTimeout(onClose, 160);
  }
  const priorFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    priorFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => closeButtonRef.current?.focus({ preventScroll: true }));
    return () => {
      if (closeTimeoutRef.current !== null) window.clearTimeout(closeTimeoutRef.current);
      document.body.style.overflow = previousOverflow;
      if (priorFocusRef.current?.isConnected) priorFocusRef.current.focus({ preventScroll: true });
    };
  }, []);

  function trapTab(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.key !== "Tab") return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => element.getAttribute("aria-hidden") !== "true");
    if (focusable.length === 0) return;
    const first = focusable.at(0);
    const last = focusable.at(-1);
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const style = {
    "--promotion-popup-bg": popup.stylingConfig.backgroundColor,
    "--promotion-popup-fg": popup.stylingConfig.textColor,
    "--promotion-popup-button": popup.stylingConfig.buttonColor,
    "--promotion-popup-button-fg": popup.stylingConfig.buttonTextColor,
  } as CSSProperties;

  return (
    <div
      className="promotion-popup-backdrop"
      data-state={closing ? "closing" : "open"}
      data-position={popup.stylingConfig.position}
      onClick={(event) => {
        if (popup.stylingConfig.backdropClose && event.target === event.currentTarget) requestClose();
      }}
      role="presentation"
    >
      <section
        ref={dialogRef}
        className="promotion-popup-card"
        data-state={closing ? "closing" : "open"}
        data-size={popup.stylingConfig.size}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={popup.description ? descriptionId : undefined}
        aria-label={preview ? "Pratinjau popup promosi" : undefined}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            requestClose();
            return;
          }
          trapTab(event);
        }}
        style={style}
        tabIndex={-1}
      >
        <div className="flex items-start justify-end">
          {preview ? (
            <span className="sr-only">Mode pratinjau admin</span>
          ) : null}
          <button
            ref={closeButtonRef}
            type="button"
            onClick={requestClose}
            aria-label="Tutup popup"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-[5px] text-current/70 transition-colors hover:bg-black/5 hover:text-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current motion-reduce:transition-none"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        {popup.imageUrl ? (
          <div className="promotion-popup-image relative mt-1 aspect-[16/9] w-full overflow-hidden rounded-[7px] bg-black/5">
            <Image
              src={popup.imageUrl}
              alt={popup.imageAlt ?? ""}
              fill
              sizes="(max-width: 640px) 92vw, (max-width: 1024px) 560px, 680px"
              className="object-contain"
            />
          </div>
        ) : null}

        <div className="px-1 pb-1 pt-4 sm:px-2 sm:pb-2 sm:pt-5">
          <h2 id={titleId} className="promotion-popup-title font-display text-[1.55rem] font-semibold leading-tight tracking-[-0.025em] sm:text-[1.85rem]">
            {popup.title}
          </h2>
          {popup.description ? (
            <p id={descriptionId} className="mt-3 whitespace-pre-line text-sm leading-relaxed opacity-80 sm:text-[0.95rem]">
              {popup.description}
            </p>
          ) : null}

          {popup.primaryButtonText && popup.primaryButtonUrl ? (
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
              <PromotionLink
                href={popup.primaryButtonUrl}
                onActivate={requestClose}
                className="promotion-popup-primary inline-flex min-h-11 items-center justify-center gap-2 rounded-[6px] px-4 py-2.5 text-sm font-semibold transition-[filter,transform] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 motion-reduce:transition-none"
              >
                {popup.primaryButtonText}
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </PromotionLink>
              {popup.secondaryButtonText && popup.secondaryButtonUrl ? (
                <PromotionLink
                  href={popup.secondaryButtonUrl}
                  onActivate={requestClose}
                  className="promotion-popup-secondary inline-flex min-h-11 items-center justify-center rounded-[6px] border border-current/20 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current motion-reduce:transition-none"
                >
                  {popup.secondaryButtonText}
                </PromotionLink>
              ) : null}
            </div>
          ) : popup.secondaryButtonText && popup.secondaryButtonUrl ? (
            <div className="mt-6">
              <PromotionLink
                href={popup.secondaryButtonUrl}
                onActivate={requestClose}
                className="promotion-popup-primary inline-flex min-h-11 items-center justify-center rounded-[6px] px-4 py-2.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
              >
                {popup.secondaryButtonText}
              </PromotionLink>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
