"use server";

import { redirect } from "next/navigation";
import type { ActionResult } from "@/lib/action-result";
import { TARGET_CLASSES, isRiskProfile, type TargetAllocation } from "@/lib/profile";
import { saveProfile } from "@/lib/wallet";

export async function saveProfileAction(_state: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const risk = formData.get("risk_profile");
  const target = Object.fromEntries(
    TARGET_CLASSES.map((name) => [name, Number(formData.get(name))]),
  ) as TargetAllocation;
  if (!isRiskProfile(risk)) return { ok: false, message: "Responda às 5 perguntas antes de salvar." };
  const result = await saveProfile({ risk_profile: risk, target_allocation: target });
  if (result.ok) redirect("/carteira");
  return result;
}
