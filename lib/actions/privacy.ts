"use server";

import { supabase } from "../supabase";

export async function checkPrivacyBudget(teamId: string, cost: number) {
  const { data } = await supabase
    .from("differential_privacy_budgets")
    .select("epsilon, delta, used_today, last_reset")
    .eq("team_id", teamId)
    .single();

  if (!data) {
    await supabase.from("differential_privacy_budgets").insert({
      team_id: teamId,
      epsilon: 1.0,
      delta: 0.00001,
      used_today: 0,
      last_reset: new Date().toISOString().split("T")[0]
    });
    return { allowed: true, remaining: 1.0 };
  }

  const today = new Date().toISOString().split("T")[0];
  if (data.last_reset !== today) {
    await supabase.from("differential_privacy_budgets")
      .update({ used_today: 0, last_reset: today })
      .eq("team_id", teamId);
    data.used_today = 0;
  }

  const remaining = Number(data.epsilon) - Number(data.used_today);
  return { allowed: remaining >= cost, remaining };
}

export async function consumePrivacyBudget(teamId: string, cost: number) {
  await supabase.from("differential_privacy_budgets")
    .update({ used_today: supabase.rpc("increment", { row_id: teamId, amount: cost }) })
    .eq("team_id", teamId);
}

export function addDifferentialPrivacyNoise(value: number, epsilon: number): number {
  const scale = 1.0 / epsilon;
  const noise = gaussianRandom() * scale;
  return value + noise;
}

function gaussianRandom(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}
