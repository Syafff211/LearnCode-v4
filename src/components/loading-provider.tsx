"use client";

import * as React from "react";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import {
  LoadingContext,
  markClientHydrated,
  type LoadingContextValue,
} from "@/components/loading-context";
import { LoadingScreen } from "@/components/loading-screen";
import {
  DEFAULT_LOADING_SAFETY_TIMEOUT_MS,
  isDocumentReady,
  shouldShowNavigationLoading,
} from "@/lib/loading-screen";

const INITIAL_LOAD_TASK = "initial-load";
const NAVIGATION_TASK = "navigation";

function NavigationWatcher({
  startTask,
  stopTask,
}: {
  startTask: (id: string) => void;
  stopTask: (id: string) => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const routeKey = search ? `${pathname}?${search}` : pathname;

  React.useEffect(() => {
    stopTask(NAVIGATION_TASK);
  }, [routeKey, stopTask]);

  React.useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      const targetElement =
        event.target instanceof Element ? event.target : null;
      const anchor = targetElement?.closest("a[href]");
      if (!anchor) return;

      if (
        shouldShowNavigationLoading({
          href: anchor.getAttribute("href"),
          currentHref: window.location.href,
          origin: window.location.origin,
          target: anchor.getAttribute("target"),
          download: anchor.hasAttribute("download"),
          defaultPrevented: event.defaultPrevented,
          button: event.button,
          metaKey: event.metaKey,
          ctrlKey: event.ctrlKey,
          shiftKey: event.shiftKey,
          altKey: event.altKey,
        })
      ) {
        startTask(NAVIGATION_TASK);
      }
    };

    const clearNavigation = () => stopTask(NAVIGATION_TASK);

    document.addEventListener("click", onDocumentClick);
    window.addEventListener("pageshow", clearNavigation);
    window.addEventListener("popstate", clearNavigation);

    return () => {
      document.removeEventListener("click", onDocumentClick);
      window.removeEventListener("pageshow", clearNavigation);
      window.removeEventListener("popstate", clearNavigation);
    };
  }, [startTask, stopTask]);

  return null;
}

export function AppLoadingProvider({ children }: { children: React.ReactNode }) {
  const activeTasksRef = React.useRef<Set<string>>(new Set());
  const safetyTimersRef = React.useRef<Map<string, number>>(new Map());
  const transitionRevealedRef = React.useRef(false);

  const [hasActiveTasks, setHasActiveTasks] = React.useState(false);
  const [routeBoundaryCount, setRouteBoundaryCount] = React.useState(0);

  const clearSafetyTimer = React.useCallback((id: string) => {
    const existing = safetyTimersRef.current.get(id);
    if (existing !== undefined) {
      window.clearTimeout(existing);
      safetyTimersRef.current.delete(id);
    }
  }, []);

  const stopTask = React.useCallback(
    (id: string) => {
      clearSafetyTimer(id);
      if (!activeTasksRef.current.has(id)) return;
      activeTasksRef.current.delete(id);
      setHasActiveTasks(activeTasksRef.current.size > 0);
    },
    [clearSafetyTimer],
  );

  const startTask = React.useCallback(
    (id: string) => {
      clearSafetyTimer(id);
      if (!activeTasksRef.current.has(id)) {
        activeTasksRef.current.add(id);
        setHasActiveTasks(true);
      }

      if (typeof window !== "undefined") {
        const timer = window.setTimeout(() => {
          safetyTimersRef.current.delete(id);
          if (activeTasksRef.current.delete(id)) {
            setHasActiveTasks(activeTasksRef.current.size > 0);
          }
        }, DEFAULT_LOADING_SAFETY_TIMEOUT_MS);
        safetyTimersRef.current.set(id, timer);
      }
    },
    [clearSafetyTimer],
  );

  const registerRouteBoundary = React.useCallback(() => {
    setRouteBoundaryCount((count) => count + 1);
    return () => {
      setRouteBoundaryCount((count) => Math.max(0, count - 1));
    };
  }, []);

  const isTransitionRevealed = React.useCallback(
    () => transitionRevealedRef.current,
    [],
  );

  const setTransitionRevealed = React.useCallback((revealed: boolean) => {
    transitionRevealedRef.current = revealed;
  }, []);

  // Coordinate initial page load on first browser open without artificial delays:
  // if the document is already complete, nothing is shown; otherwise we track
  // the real browser load + font readiness events (with a safety cap).
  React.useEffect(() => {
    markClientHydrated();
    if (typeof document === "undefined" || typeof window === "undefined") return;
    if (isDocumentReady(document.readyState)) return;

    startTask(INITIAL_LOAD_TASK);
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      stopTask(INITIAL_LOAD_TASK);
    };

    const onLoad = () => {
      if (document.fonts && typeof document.fonts.ready?.then === "function") {
        void Promise.race([
          document.fonts.ready,
          new Promise<void>((resolve) => window.setTimeout(resolve, 1500)),
        ]).finally(finish);
      } else {
        finish();
      }
    };

    window.addEventListener("load", onLoad, { once: true });
    if (isDocumentReady(document.readyState)) {
      onLoad();
    }

    return () => {
      window.removeEventListener("load", onLoad);
      finish();
    };
  }, [startTask, stopTask]);

  React.useEffect(() => {
    const timers = safetyTimersRef.current;
    return () => {
      for (const timer of timers.values()) {
        window.clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  const contextValue = React.useMemo<LoadingContextValue>(
    () => ({
      startTask,
      stopTask,
      registerRouteBoundary,
      isTransitionRevealed,
      setTransitionRevealed,
    }),
    [
      startTask,
      stopTask,
      registerRouteBoundary,
      isTransitionRevealed,
      setTransitionRevealed,
    ],
  );

  const showManagedOverlay = hasActiveTasks && routeBoundaryCount === 0;

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
      <Suspense fallback={null}>
        <NavigationWatcher startTask={startTask} stopTask={stopTask} />
      </Suspense>
      <LoadingScreen active={showManagedOverlay} managed />
    </LoadingContext.Provider>
  );
}

/**
 * Registers a long-running client process (such as waiting for AI Tutor's
 * initial response or loading remote Supabase data) with the single shared
 * LoadingScreen. Automatically cleans up on completion, error, or unmount.
 */
export function useLoadingTask(taskId: string, active: boolean): void {
  const ctx = React.useContext(LoadingContext);

  React.useEffect(() => {
    if (!ctx || !active) return;
    ctx.startTask(taskId);
    return () => ctx.stopTask(taskId);
  }, [ctx, taskId, active]);
}
