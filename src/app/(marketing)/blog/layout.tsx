import type { Metadata } from "next";

import { BlogAds } from "@/components/blog/blog-ads";
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
      {children}
      <BlogAds />
    </>
  );
}
