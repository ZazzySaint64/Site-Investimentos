import { toActionResult, type ActionResult } from "./action-result";
import { isRiskProfile, isValidTarget, type RiskProfile, type TargetAllocation } from "./profile";
import { createClient, requireUser } from "./supabase/server";

export type Profile = { risk_profile: RiskProfile; target_allocation: TargetAllocation };

export async function getProfile(): Promise<Profile | null> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("risk_profile, target_allocation")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error("Could not read the profile.");
  if (!data || !isRiskProfile(data.risk_profile) || !isValidTarget(data.target_allocation)) return null;
  return { risk_profile: data.risk_profile, target_allocation: data.target_allocation };
}

export async function saveProfile(profile: Profile): Promise<ActionResult> {
  const user = await requireUser();
  if (!isRiskProfile(profile.risk_profile) || !isValidTarget(profile.target_allocation)) {
    return { ok: false, message: "A meta precisa somar 100%, com números inteiros." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").upsert({
    user_id: user.id,
    risk_profile: profile.risk_profile,
    target_allocation: profile.target_allocation,
  });
  return toActionResult(error);
}
