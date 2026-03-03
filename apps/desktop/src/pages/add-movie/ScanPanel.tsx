import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Folder, Play, CheckCircle2 } from 'lucide-react'
import { getLastApiSource, saveLastApiSource } from '../../lib/preferences'
import { ApiSourceSelect, type ApiSource } from './ApiSourceSelect'

// Placeholder — will come from Settings in the future
const MOCK_FOLDERS = [
  'C:\\Users\\User\\Videos\\Movies',
  'D:\\Media\\Films',
]

type ScanStatus = 'idle' | 'scanning' | 'matching' | 'done'

export function ScanPanel() {
  const { t } = useTranslation()
  const [source, setSource] = useState<ApiSource | null>(getLastApiSource)

  const [status, setStatus] = useState<ScanStatus>('idle')
  const [scanProgress, setScanProgress] = useState(0)
  const [matchProgress, setMatchProgress] = useState(0)

  void setScanProgress
  void setMatchProgress
  void setStatus

  const steps = [
    {
      id: 'scan',
      labelKey: 'addMovie.search.step1',
      progress: status === 'done' ? 100 : scanProgress,
      active: status === 'scanning',
      done: status === 'matching' || status === 'done',
    },
    {
      id: 'match',
      labelKey: 'addMovie.search.step2',
      progress: status === 'done' ? 100 : matchProgress,
      active: status === 'matching',
      done: status === 'done',
    },
  ]

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 flex flex-col gap-6">
      {/* API source */}
      <div>
        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
          {t('addMovie.apiSourceLabel')}
        </p>
        <ApiSourceSelect value={source} onChange={s => { setSource(s); saveLastApiSource(s) }} />
      </div>

      <div className="border-t border-neutral-100 dark:border-neutral-800" />

      {/* Folders */}
      <div>
        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">
          {t('addMovie.search.foldersLabel')}
        </p>
        {MOCK_FOLDERS.length === 0 ? (
          <p className="text-sm text-neutral-400 dark:text-neutral-500">
            {t('addMovie.search.noFolders')}
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {MOCK_FOLDERS.map(folder => (
              <li
                key={folder}
                className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 rounded-lg"
              >
                <Folder size={14} className="shrink-0 text-neutral-400" />
                {folder}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Start scan */}
      <button
        disabled={!source || MOCK_FOLDERS.length === 0 || status !== 'idle'}
        onClick={() => { /* TODO: trigger scan via Tauri command */ }}
        className="self-start flex items-center gap-1.5 px-4 py-2 text-sm bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Play size={14} />
        {t('addMovie.search.startScan')}
      </button>

      {/* Progress steps — shown once scan starts */}
      {status !== 'idle' && (
        <>
          <div className="border-t border-neutral-100 dark:border-neutral-800" />
          <div className="flex flex-col gap-4">
            {steps.map((step, i) => (
              <div key={step.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className={[
                    'text-sm flex items-center gap-1.5',
                    step.active || step.done
                      ? 'text-neutral-900 dark:text-neutral-100'
                      : 'text-neutral-400 dark:text-neutral-600',
                  ].join(' ')}>
                    {step.done
                      ? <CheckCircle2 size={14} className="text-neutral-500" />
                      : (
                        <span className="w-4 h-4 rounded-full border border-current inline-flex items-center justify-center text-[10px] font-medium">
                          {i + 1}
                        </span>
                      )
                    }
                    {t(step.labelKey)}
                  </span>
                  <span className="text-xs text-neutral-400">
                    {step.done
                      ? t('addMovie.search.done')
                      : step.active
                        ? `${step.progress}%`
                        : ''}
                  </span>
                </div>
                <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={[
                      'h-full rounded-full transition-all duration-500',
                      step.done
                        ? 'bg-neutral-900 dark:bg-white'
                        : step.active
                          ? 'bg-neutral-400 dark:bg-neutral-500'
                          : '',
                    ].join(' ')}
                    style={{ width: step.done ? '100%' : `${step.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
