'use client'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import AppTopBar from './AppTopBar'
import AppSideNav from './AppSideNav'
import { ProfileCompletionProvider } from '@/contexts/ProfileCompletion'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  if (pathname === '/' || pathname.startsWith('/auth/')) {
    return <>{children}</>
  }

  return (
    <ProfileCompletionProvider>
      <div className="app-shell-layout">
        <AppTopBar
          onMobileNavToggle={() => setMobileNavOpen(o => !o)}
          mobileNavOpen={mobileNavOpen}
        />
        <AppSideNav
          mobileOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
        />
        <main style={{ overflowY: 'auto', background: 'var(--bg)' }}>
          {children}
        </main>
      </div>

      {/* Mobile backdrop — tap to close nav */}
      {mobileNavOpen && (
        <div
          className="mobile-nav-backdrop"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
    </ProfileCompletionProvider>
  )
}
