/**
 * Shared, client-safe shape of every admin Server Action result. Kept free of
 * server-only imports so forms and dialogs can use it in the browser bundle.
 */
export type AdminActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const IDLE_ADMIN_STATE: AdminActionState = { status: "idle" };
