"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";

import { FormMessage } from "@/components/admin/primitives";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import {
  IDLE_ADMIN_STATE,
  type AdminActionState,
} from "@/lib/actions/admin-state";

/**
 * Destructive admin action wrapper: an explicit dialog, an optional typed
 * confirmation, and an optional written reason. The server re-validates all of
 * it; this dialog only reduces accidental clicks.
 */
export function ConfirmAction({
  action,
  fields,
  title,
  description,
  triggerLabel,
  confirmLabel,
  variant = "danger",
  requireText,
  textLabel,
  reasonLabel,
  reasonRequired = false,
  triggerClassName,
}: {
  action: (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;
  fields: Record<string, string>;
  title: string;
  description: string;
  triggerLabel: string;
  confirmLabel: string;
  variant?: "danger" | "secondary";
  requireText?: string;
  textLabel?: string;
  reasonLabel?: string;
  reasonRequired?: boolean;
  triggerClassName?: string;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_ADMIN_STATE);
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant={variant} className={triggerClassName}>
          <Trash2 aria-hidden="true" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-3">
          {Object.entries(fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}

          {reasonLabel ? (
            <div className="space-y-1.5">
              <label htmlFor={`${title}-reason`} className="block text-[0.8125rem] font-medium text-ink">
                {reasonLabel}
              </label>
              <Textarea
                id={`${title}-reason`}
                name="reason"
                required={reasonRequired}
                minLength={5}
                maxLength={500}
                rows={3}
                className="text-[0.8125rem]"
                placeholder="Tulis alasan yang akan tersimpan di log audit."
              />
            </div>
          ) : null}

          {requireText ? (
            <div className="space-y-1.5">
              <label
                htmlFor={`${title}-confirm`}
                className="block text-[0.8125rem] font-medium text-ink"
              >
                {textLabel ?? `Ketik "${requireText}" untuk mengonfirmasi`}
              </label>
              <Input
                id={`${title}-confirm`}
                name="confirmation"
                required
                autoComplete="off"
                className="font-mono text-[0.8125rem]"
                placeholder={requireText}
              />
            </div>
          ) : null}

          <FormMessage status={state.status} message={state.message} />

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="sm">
                Batal
              </Button>
            </DialogClose>
            <Button type="submit" variant="danger" size="sm" loading={pending}>
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
