'use client'
import { createContext, useContext, useState, useCallback } from 'react'

interface Toast { id: number; msg: string; type: 'g' | 'r' | 'b' }
interface ToastCtx { toast: (msg: string, type?: 'g' | 'r' | 'b') => void }

const Ctx = createContext<ToastCtx>({ toast: () => {} })
export const useToast = () => useContext(Ctx)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const toast = useCallback((msg: string, type: 'g' | 'r' | 'b' = 'b') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
        {toasts.map(t => (
          <div key={t.id}
            className={`toast-enter flex items-center gap-2 bg-bg3 border border-border2 rounded-lg px-4 py-2.5 text-sm shadow-xl min-w-56
              ${t.type === 'g' ? 'border-l-2 border-l-green' : t.type === 'r' ? 'border-l-2 border-l-red' : 'border-l-2 border-l-blue'}`}>
            <span>{t.type === 'g' ? '✓' : t.type === 'r' ? '✗' : 'ℹ'}</span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}
