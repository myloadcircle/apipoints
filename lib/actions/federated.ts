"use server";

import { supabase } from "../supabase";

export async function createFederatedModel(teamId: string, name: string) {
  const { data, error } = await supabase
    .from("federated_models")
    .insert({ team_id: teamId, name, version: 1, global_weights: {} })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function submitLocalUpdate(modelId: string, teamId: string, nodeId: string, weights: any) {
  await supabase.from("local_training_jobs").insert({
    model_id: modelId,
    team_id: teamId,
    node_id: nodeId,
    weights,
    status: "pending"
  });
}

export async function aggregateFederatedModel(modelId: string) {
  const { data: jobs } = await supabase
    .from("local_training_jobs")
    .select("weights")
    .eq("model_id", modelId)
    .eq("status", "pending");

  if (!jobs || jobs.length === 0) return;

  const allWeights = jobs.map(j => j.weights);
  const avgWeights = allWeights[0];

  await supabase.from("federated_models").update({
    global_weights: avgWeights,
    version: supabase.rpc("increment_version")
  }).eq("id", modelId);

  await supabase.from("local_training_jobs").update({ status: "aggregated" }).eq("model_id", modelId);
}
