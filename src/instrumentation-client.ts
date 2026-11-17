import {
  getCommittedPathname,
  isRouteNavigationActive,
  startRouteNavigation,
  stopRouteNavigation,
} from "@/components/loading-context";
import {
  normalizePathname,
  resolveTransitionPathname,
} from "@/lib/loading-screen";

/**
 * Next.js client instrumentation hook invoked whenever App Router starts a
 * route transition (`push`, `replace`, or browser back/forward `traverse`).
 *
 * Ignores query/hash-only updates on the same pathname and never triggers for
 * local component interactions (such as sending AI Tutor messages).
 */
export function onRouterTransitionStart(url: string): void {
  if (typeof window === "undefined") return;

  const currentPathname = getCommittedPathname() ?? window.location.pathname;
  const nextPathname = resolveTransitionPathname({
    href: url,
    currentPathname,
    origin: window.location.origin,
  });

  if (nextPathname !== null) {
    startRouteNavigation();
    return;
  }

  // If the user navigated back/forward to the already-committed pathname while
  // a previous slow navigation was still pending, dismiss the pending state.
  if (isRouteNavigationActive()) {
    try {
      const targetPath = normalizePathname(
        new URL(url, window.location.origin).pathname,
      );
      if (targetPath === normalizePathname(currentPathname)) {
        stopRouteNavigation();
      }
    } catch {
      stopRouteNavigation();
    }
  }
}
