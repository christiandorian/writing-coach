import WorkspaceHeader from '@/components/workspace/WorkspaceHeader'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col bg-[var(--bg)] overflow-hidden">
      <WorkspaceHeader />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
