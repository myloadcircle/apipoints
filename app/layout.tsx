import './globals.css'

export const metadata = {
  title: 'APIPoints V1',
  description: 'Local-first API marketplace',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
