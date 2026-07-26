"use server";

import { supabase } from "../supabase";

export async function createSwarm(teamId: string, agents: string[]) {
  const { data: swarm } = await supabase
    .from("swarm_agents")
    .insert(agents.map(id => ({ team_id: teamId, role: "worker", id })))
    .select("id")
    .then(res => ({ data: res.data?.[0] }));

  if (!swarm) throw new Error("Failed to create swarm");

  await supabase.from("swarm_topology").insert({
    swarm_id: swarm.id,
    agent_ids: agents,
    topology: { type: "mesh" }
  });

  return swarm;
}

export async function submitSwarmTask(swarmId: string, taskType: string, payload: any) {
  const { data, error } = await supabase
    .from("swarm_tasks")
    .insert({ swarm_id: swarmId, task_type: taskType, payload })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function runSwarmConsensus(swarmId: string) {
  const { data: tasks } = await supabase
    .from("swarm_tasks")
    .select("*")
    .eq("swarm_id", swarmId)
    .eq("status", "pending");

  const results = tasks?.map(t => t.payload) || [];
  const consensus = results.length > 0 ? results[0] : null;

  await supabase.from("swarm_tasks")
    .update({ status: "completed" })
    .eq("swarm_id", swarmId)
    .eq("status", "pending");

  return consensus;
}
