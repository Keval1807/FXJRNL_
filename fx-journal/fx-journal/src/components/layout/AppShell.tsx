'use client'
import { useState } from 'react'
import Sidebar from './Sidebar'
import { TradeStats } from '@/types'

interface AppShellProps {
  children: React.ReactNode
  stats: TradeStats
  userEmail: string
  tradeCount: number
  pageTitle: string
  action?: React.ReactNode
}

export default function AppShell({ children, stats, userEmail, tradeCount, pageTitle, action }: AppShellProps) {
  const now = new Date().toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }).toUpperCase()

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar stats={stats} userEmail={userEmail} tradeCount={tradeCount} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <div className="h-12 min-h-12 bg-bg2 border-b border-border flex items-center px-5 gap-3 flex-shrink-0">
          <span className="text-[11px] font-semibold text-tx3 tracking-widest flex-1">{now}</span>
          {action}
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5"
          style={{background:'radial-gradient(ellipse at 0% 0%,rgba(0,212,160,.03) 0%,transparent 40%),#0e1117'}}>
          {children}
        </div>
      </div>
    </div>
  )
}
