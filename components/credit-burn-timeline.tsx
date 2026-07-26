export default function CreditBurnTimeline({ events }: { events: any[] }) {
  if (!events || events.length === 0) {
    return (
      <div className="rounded-lg border p-4 bg-[#0D0D0D] text-white">
        <h3 className="text-lg font-semibold mb-3">Credit Burn Timeline</h3>
        <p className="text-gray-400 text-sm">No usage events yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border p-4 bg-[#0D0D0D] text-white">
      <h3 className="text-lg font-semibold mb-3">Credit Burn Timeline</h3>

      <div className="relative border-l border-gray-700 pl-6 space-y-6 max-h-96 overflow-y-auto">
        {events.map((e) => (
          <div key={e.id} className="relative">
            <div className="absolute -left-3 top-1 w-2 h-2 bg-[#4A4AFF] rounded-full"></div>

            <p className="text-sm text-gray-400">
              {new Date(e.created_at).toLocaleString()}
            </p>

            <p className="text-gray-200">
              Burned{" "}
              <span className="text-red-400 font-bold">
                {e.credits_burned}
              </span>{" "}
              credits
            </p>

            <p className="text-gray-400 text-sm">{e.event_type}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
