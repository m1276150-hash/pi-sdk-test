// app/layout.js
export const metadata = {
  title: 'Xpaio',
  description: 'Next.js project on Netlify',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}