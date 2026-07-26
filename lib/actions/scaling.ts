"use server";

import { supabase } from "../supabase";

export async function getNodeForecast(teamId: string) {
  const { data } = await supabase.rpc("get_node_forecast", { team_id: teamId });
  return data || [];
}

export async function selectBestNode(teamId: string) {
  const { data: forecast } = await supabase.rpc("get_node_forecast", { team_id: teamId });

  if (!forecast || forecast.length === 0) {
    const { data: node } = await supabase
      .from("execution_nodes")
      .select("*")
      .eq("team_id", teamId)
      .limit(1)
      .single();
    return node;
  }

  forecast.sort((a: any, b: any) => a.score - b.score);
  const { data: node } = await supabase
    .from("execution_nodes")
    .select("*")
    .eq("id", forecast[0].node_id)
    .single();

  return node;
}

export async function evaluateScaling(teamId: string) {
  const { data: forecast } = await supabase.rpc("get_node_forecast", { team_id: teamId });
  if (!forecast || forecast.length === 0) return;

  const avgScore = forecast.reduce((acc: number, f: any) => acc + f.score, 0) / forecast.length;

  if (avgScore > 0.8) await scaleUp(teamId);
  else if (avgScore < 0.3) await scaleDown(teamId);
}

async function scaleUp(teamId: string) {
  console.log(`Scaling up for team ${teamId}`);
}

async function scaleDown(teamId: string) {
  console.log(`Scaling down for team ${teamId}`);
}

export async function healNodeMesh(teamId: string) {
  const { data: nodes } = await supabase
    .from("execution_nodes")
    .select("*")
    .eq("team_id", teamId);

  const now = Date.now();
  for (const node of nodes || []) {
    const last = new Date(node.last_heartbeat).getTime();
    const diffSec = (now - last) / 1000;

    if (diffSec > 60 && node.status !== "offline") {
      await supabase.from("execution_nodes")
        .update({ status: "offline" })
        .eq("id", node.id);
    }
  }
}

export async function replicateAgentToRegion(agentId: string, teamId: string, region: string) {
  const { data: node } = await supabase
    .from("execution_nodes")
    .select("*")
    .eq("team_id", teamId)
    .eq("status", "online")
    .like("name", `${region}%`)
    .limit(1)
    .single();

  if (!node) throw new Error(`No node available in region ${region}`);

  await supabase.from("global_agent_replicas").insert({
    agent_id: agentId,
    team_id: teamId,
    region,
    node_id: node.id
  });

  return node;
}
