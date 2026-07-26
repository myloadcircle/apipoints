export default function UpgradeNudge({ creditsRemaining }: { creditsRemaining: number }) {
  if (creditsRemaining > 20000) return null

  return (
    <div className="bg-[#1A1A3A] border border-[#4A4AFF] p-4 rounded-lg text-white mb-6">
      <h3 className="text-lg font-semibold mb-2">Running Low on Credits</h3>
      <p className="text-gray-300 mb-4">
        Upgrade to a higher plan for more credits and uninterrupted agent
        performance.
      </p>

      <a
        href="/pricing"
        className="block w-full py-2 rounded bg-[#4A4AFF] hover:bg-[#5A5AFF] text-center"
      >
        Upgrade Plan
      </a>
    </div>
  )
}
