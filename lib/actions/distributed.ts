"use server";

import { supabase } from "../supabase";

export async function selectExecutionNode(teamId: string) {
  const { data } = await supabase
    .from("execution_nodes")
    .select("*")
    .eq("team_id", teamId)
    .order("cpu_capacity", { ascending: false })
    .order("last_heartbeat", { ascending: false })
    .limit(1)
    .single();

  if (!data) throw new Error("No execution nodes available");
  return data;
}

export async function readMemoryVault(agentId: string, teamId: string) {
  const { data } = await supabase
    .from("agent_memory_vaults")
    .select("memory")
    .eq("agent_id", agentId)
    .eq("team_id", teamId)
    .single();

  return data?.memory || [];
}

export async function writeMemoryVault(agentId: string, teamId: string, memory: any) {
  await supabase.from("agent_memory_vaults").upsert({
    agent_id: agentId,
    team_id: teamId,
    memory,
    updated_at: new Date().toISOString()
  }, { onConflict: "agent_id,team_id" });
}

export async function queueOfflineExecution(agentId: string, teamId: string, input: string) {
  await supabase.from("offline_execution_queue").insert({
    agent_id: agentId,
    team_id: teamId,
    input
  });
}

export async function syncOfflineQueue(teamId: string) {
  const { data: queue } = await supabase
    .from("offline_execution_queue")
    .select("*")
    .eq("team_id", teamId)
    .eq("synced", false)
    .order("created_at", { ascending: true });

  for (const job of queue || []) {
    // In production, call runDistributedAgent here
    await supabase.from("offline_execution_queue").update({ synced: true }).eq("id", job.id);
  }
}
