'use client'
import { usePathname } from 'next/navigation'
import AppTopBar from './AppTopBar'
import AppSideNav from './AppSideNav'
import { ProfileCompletionProvider } from '@/contexts/ProfileCompletion'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname === '/' || pathname.startsWith('/auth/')) {
    return <>{children}</>
  }

  return (
    <ProfileCompletionProvider>
      <div className="app-shell-layout">
        <AppTopBar />
        <AppSideNav />
        <main style={{ overflowY: 'auto', background: 'var(--bg)' }}>
          {children}
        </main>
      </div>
    </ProfileCompletionProvider>
  )
}
