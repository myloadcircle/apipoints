"use server";

import { supabase } from "../supabase";
import { randomUUID } from "node:crypto";

export async function loadVMProfile(agentId: string, teamId: string) {
  const { data } = await supabase
    .from("agent_vm_profiles")
    .select("*")
    .eq("agent_id", agentId)
    .eq("team_id", teamId)
    .single();

  if (!data) {
    await supabase.from("agent_vm_profiles").insert({ agent_id: agentId, team_id: teamId });
    return { cpu_limit_ms: 200, memory_limit_mb: 256, token_limit: 50000, deterministic_seed: "default" };
  }
  return data;
}

export async function saveReplaySnapshot(agentId: string, teamId: string, input: string, output: string, traceId: string, snapshot: any) {
  await supabase.from("agent_replay_logs").insert({
    agent_id: agentId,
    team_id: teamId,
    input,
    output,
    trace_id: traceId,
    vm_snapshot: snapshot
  });
}

export async function replayAgentRun(traceId: string) {
  const { data, error } = await supabase
    .from("agent_replay_logs")
    .select("*")
    .eq("trace_id", traceId)
    .single();

  if (error || !data) throw new Error("Replay not found");
  return { input: data.input, output: data.output, vm: data.vm_snapshot };
}

export async function startSpan(agentId: string, teamId: string, traceId: string, name: string) {
  const { data } = await supabase
    .from("agent_traces")
    .insert({ agent_id: agentId, team_id: teamId, span_name: name, metadata: { traceId } })
    .select("id")
    .single();
  return data;
}

export async function endSpan(spanId: string) {
  await supabase.from("agent_traces").update({ end_time: new Date() }).eq("id", spanId);
}

export async function getTraceTimeline(traceId: string) {
  const { data } = await supabase
    .from("agent_traces")
    .select("*")
    .eq("metadata->>traceId", traceId)
    .order("start_time", { ascending: true });
  return data || [];
}

import { AgentContainer } from "../container";

export async function runVirtualizedAgent(agentId: string, teamId: string, input: string) {
  const profile = await loadVMProfile(agentId, teamId);
  const vm = new AgentContainer({
    agentId,
    teamId,
    runtime: "js",
    memoryLimit: profile.memory_limit_mb,
    cpuLimit: profile.cpu_limit_ms
  });
  const traceId = randomUUID();
  const span = await startSpan(agentId, teamId, traceId, "agent.run");
  const output = await vm.run(input);
  await endSpan(span.id);
  await saveReplaySnapshot(agentId, teamId, input, output, traceId, {
    cpu_limit_ms: profile.cpu_limit_ms,
    memory_limit_mb: profile.memory_limit_mb,
    token_limit: profile.token_limit,
    deterministic_seed: profile.deterministic_seed
  });
  return { output, traceId };
}
