"use client";

export function TraceTimeline({ spans }: { spans: any[] }) {
  return (
    <div className="bg-[#0D0D0D] border p-6 rounded-xl text-white">
      <h2 className="text-2xl font-semibold mb-4">Execution Timeline</h2>
      <div className="space-y-4">
        {spans.map((s) => (
          <div key={s.id} className="border p-4 rounded bg-black">
            <p className="font-semibold">{s.span_name}</p>
            <p className="text-gray-300">
              {new Date(s.start_time).toLocaleString()} →{" "}
              {s.end_time ? new Date(s.end_time).toLocaleString() : "running"}
            </p>
            <p className="text-gray-400 text-sm">
              Metadata: {JSON.stringify(s.metadata)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
