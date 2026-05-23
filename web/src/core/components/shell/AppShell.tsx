'use client'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import AppTopBar from '@/core/components/shell/AppTopBar'
import AppSideNav from '@/core/components/shell/AppSideNav'
import { ProfileCompletionProvider } from '@/core/contexts/ProfileCompletion'

export default function AppShell({ children, role }: { children: React.ReactNode; role: string }) {
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
          initialRole={role}
        />
        <main style={{ overflowY: 'auto', background: 'var(--bg)' }}>
          {children}
        </main>
      </div>

      {mobileNavOpen && (
        <div
          className="mobile-nav-backdrop"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
    </ProfileCompletionProvider>
  )
}
