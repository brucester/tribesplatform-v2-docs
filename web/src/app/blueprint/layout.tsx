export default function BlueprintLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, overflow: 'hidden' }}>
      {children}
    </div>
  )
}
