import { useState, useEffect, useRef } from 'react'

export function PerfOverlay() {
  const [visible, setVisible] = useState(false)
  const [fps, setFps] = useState(0)
  const [memory, setMemory] = useState<number | null>(null)
  const rafRef = useRef<number>(0)

  // Toggle with Ctrl+Shift+P
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault()
        setVisible(v => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // FPS + memory loop
  useEffect(() => {
    if (!visible) return

    let frameCount = 0
    let lastTime = performance.now()

    function tick() {
      frameCount++
      const now = performance.now()
      const elapsed = now - lastTime

      if (elapsed >= 1000) {
        setFps(Math.round((frameCount * 1000) / elapsed))
        frameCount = 0
        lastTime = now

        const mem = (performance as { memory?: { usedJSHeapSize: number } }).memory
        if (mem) setMemory(Math.round(mem.usedJSHeapSize / 1024 / 1024))
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [visible])

  if (!visible) return null

  const fpsColor = fps >= 55 ? 'text-green-400' : fps >= 30 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black/85 backdrop-blur-sm text-xs font-mono rounded-lg p-2.5 min-w-[90px] select-none pointer-events-none">
      <div className="flex items-center justify-between gap-3">
        <span className="text-neutral-500">FPS</span>
        <span className={`font-bold tabular-nums ${fpsColor}`}>{fps}</span>
      </div>
      {memory !== null && (
        <div className="flex items-center justify-between gap-3 mt-0.5">
          <span className="text-neutral-500">MEM</span>
          <span className="text-blue-400 font-bold tabular-nums">{memory} MB</span>
        </div>
      )}
      <div className="mt-1.5 text-neutral-600 text-[9px] text-center">Ctrl+Shift+P</div>
    </div>
  )
}
