"use client";

export function NodeMeshDashboard({ nodes, metrics }: { nodes: any[]; metrics: any[] }) {
  return (
    <div className="bg-[#0D0D0D] border p-6 rounded-xl text-white space-y-6">
      <h2 className="text-2xl font-semibold">Execution Node Mesh</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {nodes.map((n) => {
          const m = metrics.find((x) => x.node_id === n.id);
          return (
            <div key={n.id} className="border p-4 rounded bg-black">
              <p className="font-semibold">{n.name}</p>
              <p className="text-sm text-gray-400">Status: {n.status}</p>
              <p className="text-sm text-gray-400">
                CPU: {m?.cpu_load ?? 0}% • MEM: {m?.memory_load ?? 0}% • Jobs: {m?.active_jobs ?? 0}
              </p>
              <p className="text-xs text-gray-500">
                Last heartbeat: {new Date(n.last_heartbeat).toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
