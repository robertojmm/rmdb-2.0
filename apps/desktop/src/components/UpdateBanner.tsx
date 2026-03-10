import { useEffect, useState } from 'react'
import { check, type Update } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { Download, X, RefreshCw } from 'lucide-react'

export function UpdateBanner() {
  const [update, setUpdate] = useState<Update | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [progress, setProgress] = useState(0)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const timeout = setTimeout(() => {
      void check().then(u => { if (u) setUpdate(u) }).catch(() => {})
    }, 3000)
    return () => clearTimeout(timeout)
  }, [])

  if (!update || dismissed) return null

  const pct = total > 0 ? Math.round((progress / total) * 100) : 0

  async function install() {
    if (!update) return
    setInstalling(true)
    let downloaded = 0
    await update.downloadAndInstall(event => {
      if (event.event === 'Started' && event.data.contentLength) {
        setTotal(event.data.contentLength)
      } else if (event.event === 'Progress') {
        downloaded += event.data.chunkLength
        setProgress(downloaded)
      }
    })
    await relaunch()
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl shadow-2xl text-sm">
      {installing ? (
        <>
          <RefreshCw size={14} className="animate-spin shrink-0" />
          <span className="tabular-nums">
            {total > 0 ? `Instalando... ${pct}%` : 'Descargando...'}
          </span>
          {total > 0 && (
            <div className="w-24 h-1.5 bg-white/20 dark:bg-black/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white dark:bg-neutral-900 rounded-full transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </>
      ) : (
        <>
          <Download size={14} className="shrink-0" />
          <span>
            Nueva versión disponible: <strong>{update.version}</strong>
          </span>
          <button
            onClick={() => void install()}
            className="shrink-0 px-2.5 py-1 text-xs font-medium bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-lg hover:opacity-80 transition-opacity cursor-pointer"
          >
            Instalar y reiniciar
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 text-white/60 dark:text-neutral-900/60 hover:text-white dark:hover:text-neutral-900 transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </>
      )}
    </div>
  )
}
