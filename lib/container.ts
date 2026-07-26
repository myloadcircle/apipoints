import vm from "node:vm";
import { spawn } from "node:child_process";
import { performance } from "node:perf_hooks";
import { supabase } from "./supabase";

export class AgentContainer {
  agentId: string;
  teamId: string;
  runtime: string;
  memoryLimit: number;
  cpuLimit: number;

  constructor(agentConfig: any) {
    this.agentId = agentConfig.agentId;
    this.teamId = agentConfig.teamId;
    this.runtime = agentConfig.runtime;
    this.memoryLimit = agentConfig.memoryLimit || 256;
    this.cpuLimit = agentConfig.cpuLimit || 200;
  }

  async run(input) {
    if (this.runtime === "js") return await runJsSandbox(this, input);
    if (this.runtime === "python") return await runPythonSandbox(this, input);
    throw new Error("Unsupported runtime");
  }
}

async function runJsSandbox(container, input) {
  const script = new vm.Script(`
    (async () => {
      const agent = globalThis.agent;
      return await agent(input);
    })();
  `);

  const context = vm.createContext({
    input,
    globalThis: {
      agent: (userInput) => `Processed JS: ${userInput}`
    }
  });

  const start = performance.now();
  const result = await script.runInContext(context, { timeout: container.cpuLimit });
  const end = performance.now();

  const cpuUsed = end - start;
  const memoryUsed = process.memoryUsage().heapUsed / 1024 / 1024;

  await recordResourceUsage(container.teamId, container.agentId, cpuUsed, memoryUsed, 0);
  return result;
}

async function runPythonSandbox(container, input) {
  return new Promise((resolve, reject) => {
    const proc = spawn("python3", ["-c", `print('Processed PY:', '${input}')`], { shell: true });
    let output = "", error = "";
    const start = performance.now();

    proc.stdout.on("data", (data) => (output += data.toString()));
    proc.stderr.on("data", (data) => (error += data.toString()));

    proc.on("close", async () => {
      const end = performance.now();
      await recordResourceUsage(container.teamId, container.agentId, end - start, 50, 0);
      error ? reject(error) : resolve(output.trim());
    });
  });
}

export async function recordResourceUsage(teamId, agentId, cpu, memory, tokens) {
  await supabase.from("agent_resource_usage").insert({
    team_id: teamId,
    agent_id: agentId,
    cpu_ms: cpu,
    memory_mb: memory,
    tokens_used: tokens
  });
}
