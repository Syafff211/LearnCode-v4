"use client";

import Image from "next/image";
import { ArrowUpRight, X } from "lucide-react";
import type { CSSProperties } from "react";

import type { PromotionPopupPublic } from "@/lib/promotional-popup";

export function PromotionPopupLivePreview({ popup }: { popup: PromotionPopupPublic }) {
  const style = {
    "--promotion-popup-bg": popup.stylingConfig.backgroundColor,
    "--promotion-popup-fg": popup.stylingConfig.textColor,
    "--promotion-popup-button": popup.stylingConfig.buttonColor,
    "--promotion-popup-button-fg": popup.stylingConfig.buttonTextColor,
  } as CSSProperties;

  return (
    <div className="relative grid min-h-[28rem] place-items-center overflow-hidden rounded-[8px] border border-line bg-[#111711] p-4 sm:min-h-[34rem]" aria-label="Pratinjau langsung popup">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(168,211,91,0.14),_transparent_65%)]" aria-hidden="true" />
      <div className="absolute inset-0 bg-black/35" aria-hidden="true" />
      <section
        className="promotion-popup-card relative"
        data-size={popup.stylingConfig.size}
        style={{ ...style, maxHeight: "min(30rem, calc(100% - 1rem))" }}
        aria-label="Contoh tampilan popup promosi"
      >
        <div className="flex items-start justify-end">
          <span className="inline-flex size-8 items-center justify-center text-current/50" aria-hidden="true">
            <X className="size-4" />
          </span>
        </div>
        {popup.imageUrl ? (
          <div className="relative mt-1 aspect-[16/9] w-full overflow-hidden rounded-[7px] bg-black/5">
            <Image src={popup.imageUrl} alt={popup.imageAlt ?? ""} fill sizes="(max-width: 640px) 80vw, 480px" className="object-contain" />
          </div>
        ) : null}
        <div className="px-1 pb-1 pt-4 sm:px-2 sm:pb-2 sm:pt-5">
          <h2 className="promotion-popup-title font-display text-[1.45rem] font-semibold leading-tight tracking-[-0.025em] sm:text-[1.75rem]">
            {popup.title || "Judul popup"}
          </h2>
          {popup.description ? <p className="mt-3 whitespace-pre-line text-sm leading-relaxed opacity-80">{popup.description}</p> : null}
          {popup.primaryButtonText || popup.secondaryButtonText ? (
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
              {popup.primaryButtonText ? (
                <span className="promotion-popup-primary inline-flex min-h-11 items-center justify-center gap-2 rounded-[6px] px-4 py-2.5 text-sm font-semibold">
                  {popup.primaryButtonText}<ArrowUpRight className="size-4" aria-hidden="true" />
                </span>
              ) : null}
              {popup.secondaryButtonText ? (
                <span className="promotion-popup-secondary inline-flex min-h-11 items-center justify-center rounded-[6px] border border-current/20 px-4 py-2.5 text-sm font-medium">
                  {popup.secondaryButtonText}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
