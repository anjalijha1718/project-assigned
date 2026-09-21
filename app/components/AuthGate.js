'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { getStoredAuth } from '@/app/lib/api'

const publicRoutes = new Set(['/login', '/signup'])

export default function AuthGate({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const auth = getStoredAuth()
    const onPublicPath = publicRoutes.has(pathname)

    if (!auth?.token && !onPublicPath) {
      router.replace('/login')
      return
    }

    if (auth?.token && pathname === '/login') {
      router.replace('/')
      return
    }

    setReady(true)
  }, [pathname, router])

  if (!ready) return null

  return children
}
