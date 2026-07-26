"use client";

export function ComplianceExportUI() {
  return (
    <div className="bg-[#0D0D0D] border p-6 rounded-xl text-white space-y-6">
      <h2 className="text-2xl font-semibold">Compliance Exports</h2>
      <form action="/api/compliance/export" method="POST" className="space-y-4">
        <select name="exportType" className="w-full p-2 rounded bg-black border">
          <option value="audit_logs">Audit Logs</option>
          <option value="agent_runs">Agent Runs</option>
          <option value="workflows">Workflows</option>
        </select>
        <button type="submit" className="w-full py-2 rounded bg-[#4A4AFF] hover:bg-[#5A5AFF]">
          Generate Export
        </button>
      </form>
    </div>
  );
}
