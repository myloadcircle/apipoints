export default function CreditExpiryNotice({ lastUpdated }: { lastUpdated: string }) {
  if (!lastUpdated) return null

  const expiryDate = new Date(lastUpdated)
  expiryDate.setDate(expiryDate.getDate() + 30)

  const daysLeft = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  if (daysLeft > 7) return null

  return (
    <div className="bg-yellow-600 text-black p-3 rounded mb-4 text-center">
      Credits expire on{" "}
      <span className="font-bold">
        {expiryDate.toLocaleDateString()}
      </span>
      {" "}({daysLeft} days left)
    </div>
  )
}
