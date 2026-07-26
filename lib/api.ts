export async function fetchJSON(url: string, options: any = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
  return res.json()
}
