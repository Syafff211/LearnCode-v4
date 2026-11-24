import type { Metadata } from "next";

import { BlogAds } from "@/components/blog/blog-ads";
import { BlogSideAd } from "@/components/blog/blog-side-ad";
import { HILLTOPADS_REFERRER_POLICY } from "@/lib/blog-ads";

export const metadata: Metadata = {
  referrer: HILLTOPADS_REFERRER_POLICY,
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="mx-auto flex w-full max-w-[1880px] items-start justify-center xl:gap-3 xl:px-3 2xl:gap-6 2xl:px-6">
        <BlogSideAd side="left" />
        <div className="min-w-0 flex-1 xl:max-w-[1200px] xl:[&_.container-lc]:px-5 2xl:[&_.container-lc]:px-8">
          {children}
        </div>
        <BlogSideAd side="right" />
      </div>
      <BlogAds />
    </>
  );
}
