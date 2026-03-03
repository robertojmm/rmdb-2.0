import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Check, Search, AlertCircle } from 'lucide-react'
import { api } from '../../lib/api'

export type ApiSource = { id: string; label: string }

type RawSource = { id: number; name: string; needsConfiguration: boolean; apiKey: string | null }
type SelectSource = ApiSource & { disabled: boolean }

interface Props {
  value: ApiSource | null
  onChange: (source: ApiSource) => void
}

export function ApiSourceSelect({ value, onChange }: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [sources, setSources] = useState<SelectSource[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void (async () => {
      const result = await api['api-sources'].get()
      if (result.data) {
        setSources(
          (result.data as RawSource[]).map(s => ({
            id: String(s.id),
            label: s.name,
            disabled: s.needsConfiguration && s.apiKey === null,
          }))
        )
      }
    })()
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = sources.filter(s =>
    s.label.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-left hover:border-neutral-400 dark:hover:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-500 transition-colors"
      >
        <span className={value ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-400 dark:text-neutral-500'}>
          {value ? value.label : t('addMovie.apiSourcePlaceholder')}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-neutral-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-10 overflow-hidden">
          <div className="flex items-center gap-2 p-2 border-b border-neutral-100 dark:border-neutral-700">
            <Search size={14} className="shrink-0 text-neutral-400" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t('addMovie.apiSourceSearchPlaceholder')}
              className="flex-1 text-sm bg-transparent focus:outline-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
            />
          </div>
          <div className="py-1 max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-sm text-neutral-400">{t('addMovie.apiSourceEmpty')}</p>
            ) : (
              filtered.map(source => (
                <button
                  key={source.id}
                  type="button"
                  disabled={source.disabled}
                  onClick={() => { onChange(source); setOpen(false); setQuery('') }}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
                >
                  <span className="text-neutral-900 dark:text-neutral-100">{source.label}</span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    {source.disabled && (
                      <span className="flex items-center gap-1 text-xs text-neutral-400">
                        <AlertCircle size={12} />
                        {t('addMovie.apiSourceNotConfigured')}
                      </span>
                    )}
                    {!source.disabled && value?.id === source.id && (
                      <Check size={14} className="text-neutral-500" />
                    )}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
