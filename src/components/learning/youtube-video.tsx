import { ExternalLink } from "lucide-react";

import { getYouTubeWatchUrl, isYouTubeVideoId } from "@/lib/youtube";
import { cn } from "@/lib/utils";

export function YouTubeVideo({
  videoId,
  title,
  description,
  className,
}: {
  videoId: string;
  title?: string | null;
  description?: string | null;
  className?: string;
}) {
  if (!isYouTubeVideoId(videoId)) return null;

  const watchUrl = getYouTubeWatchUrl(videoId);
  const descriptiveTitle = title?.trim() || "Video pembelajaran LearnCode";

  return (
    <figure className={cn("overflow-hidden rounded-[8px] border border-line bg-surface", className)}>
      {title || description ? (
        <div className="border-b border-line px-4 py-3">
          {title ? <p className="text-sm font-medium text-ink">{title}</p> : null}
          {description ? (
            <p className="mt-1 text-xs leading-relaxed text-muted">{description}</p>
          ) : null}
        </div>
      ) : null}
      <div className="aspect-video w-full bg-[#111]">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
          title={`Video pembelajaran: ${descriptiveTitle}`}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="encrypted-media; picture-in-picture; web-share"
          allowFullScreen
          className="size-full border-0"
        />
      </div>
      {watchUrl ? (
        <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2.5 text-[11px] leading-relaxed text-muted">
          <span>Jika video tidak dapat diputar di sini, buka langsung di YouTube.</span>
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-accent-text underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text"
          >
            Buka di YouTube
            <ExternalLink className="size-3" aria-hidden="true" />
          </a>
        </figcaption>
      ) : null}
    </figure>
  );
}
