'use client'
import { createContext, useContext, useState, type ReactNode } from 'react'

type Ctx = { pct: number | null; setPct: (pct: number | null) => void }

const ProfileCompletionContext = createContext<Ctx>({ pct: null, setPct: () => {} })

export function ProfileCompletionProvider({ children }: { children: ReactNode }) {
  const [pct, setPct] = useState<number | null>(null)
  return (
    <ProfileCompletionContext.Provider value={{ pct, setPct }}>
      {children}
    </ProfileCompletionContext.Provider>
  )
}

export function useProfileCompletion() {
  return useContext(ProfileCompletionContext)
}
