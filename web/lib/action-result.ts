// Pure: shared by every server action that writes to the database.
export type ActionResult = { ok: true } | { ok: false; message: string };

export const GENERIC_SAVE_ERROR = "Não foi possível salvar. Tente de novo.";

// P0001 is a rule the database raised with a message written for the user. Anything else is hidden.
export function toActionResult(error: { code?: string; message: string } | null): ActionResult {
  if (!error) return { ok: true };
  return { ok: false, message: error.code === "P0001" ? error.message : GENERIC_SAVE_ERROR };
}
