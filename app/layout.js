import './globals.css'
import AuthGate from './components/AuthGate'

export const metadata = {
  title: 'Homepage | Silent House',
  description: 'Three unique companies under one roof, creating experiences you\'ll never forget.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  )
}
