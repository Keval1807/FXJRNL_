'use client'
import { useEffect, useRef } from 'react'

interface GaugeProps {
  label: string
  value: string
  sub: string
  bottom: string
  pct: number
  color: string
}

export default function Gauge({ label, value, sub, bottom, pct, color }: GaugeProps) {
  const fillRef = useRef<SVGCircleElement>(null)
  const r = 42, cx = 50, cy = 50
  const circ = 2 * Math.PI * r
  const arc = circ * 0.75
  const filled = arc * (Math.min(100, Math.max(0, pct)) / 100)

  useEffect(() => {
    if (!fillRef.current) return
    fillRef.current.style.strokeDasharray = `0 ${circ}`
    const t = setTimeout(() => {
      if (fillRef.current) {
        fillRef.current.style.transition = 'stroke-dasharray 0.9s cubic-bezier(0.4,0,0.2,1)'
        fillRef.current.style.strokeDasharray = `${filled} ${circ}`
      }
    }, 100)
    return () => clearTimeout(t)
  }, [filled, circ])

  return (
    <div className="card p-5 flex flex-col items-center gap-1 hover:-translate-y-px transition-transform cursor-default">
      <div className="relative w-24 h-20 mb-1">
        <svg className="-rotate-180" width="100" height="80" viewBox="0 0 100 80">
          <circle
            cx={cx} cy={cy} r={r}
            fill="none" stroke="#1f2a3c" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${arc} ${circ}`}
            strokeDashoffset={`${-circ * 0.125}`}
          />
          <circle
            ref={fillRef}
            cx={cx} cy={cy} r={r}
            fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${filled} ${circ}`}
            strokeDashoffset={`${-circ * 0.125}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span className="text-xl font-black font-mono leading-none" style={{ color }}>{value}</span>
          <span className="text-[9px] font-bold uppercase tracking-wide opacity-60" style={{ color }}>{sub}</span>
        </div>
      </div>
      <div className="text-[10.5px] font-bold uppercase tracking-wider text-tx3">{label}</div>
      <div className="text-[11px] text-tx3">{bottom}</div>
    </div>
  )
}
