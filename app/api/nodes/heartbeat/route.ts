import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { nodeId, cpuLoad, memoryLoad } = await req.json();

  const { data: node } = await supabase
    .from("execution_nodes")
    .select("cpu_capacity, memory_capacity")
    .eq("id", nodeId)
    .single();

  if (!node) return NextResponse.json({ error: "Node not found" }, { status: 404 });

  const status = cpuLoad > node.cpu_capacity || memoryLoad > node.memory_capacity ? "degraded" : "online";

  const { error } = await supabase
    .from("execution_nodes")
    .update({
      last_heartbeat: new Date().toISOString(),
      status
    })
    .eq("id", nodeId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
