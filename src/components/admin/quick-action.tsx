"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { IDLE_ADMIN_STATE, type AdminActionState } from "@/lib/actions/admin-state";
import { cn } from "@/lib/utils";

/**
 * Compact inline form for row-level actions (publish, archive, move). Each
 * submission goes through a Server Action that re-checks the admin session.
 */
export function QuickAction({
  action,
  fields,
  label,
  variant = "ghost",
  className,
  children,
  confirm,
}: {
  action: (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;
  fields: Record<string, string>;
  label: string;
  variant?: "ghost" | "secondary" | "primary" | "quiet";
  className?: string;
  children?: React.ReactNode;
  confirm?: string;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_ADMIN_STATE);

  return (
    <form
      action={formAction}
      className="inline-flex flex-col items-start gap-0.5"
      onSubmit={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Button
        type="submit"
        size="sm"
        variant={variant}
        loading={pending}
        className={cn("[&_svg]:size-3.5", className)}
        title={label}
      >
        {children}
        <span className={children ? "sr-only" : undefined}>{label}</span>
      </Button>
      {state.status === "error" ? (
        <span role="alert" className="max-w-[14rem] text-[10px] leading-tight text-danger">
          {state.message}
        </span>
      ) : null}
      {state.status === "success" ? (
        <span role="status" className="max-w-[14rem] text-[10px] leading-tight text-ok">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
