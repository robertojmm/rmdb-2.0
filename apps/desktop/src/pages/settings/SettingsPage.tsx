import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Settings2, X, Check, FolderPlus, Trash2, FolderOpen, RotateCcw, HardDrive } from 'lucide-react'
import { open } from '@tauri-apps/plugin-dialog'
import { invoke } from '@tauri-apps/api/core'
import { type Theme, useTheme } from '../../context/ThemeContext'
import { api } from '../../lib/api'
import { logger } from '../../lib/logger'

const LANGUAGES = [
  { code: 'en', labelKey: 'settings.languages.en' },
  { code: 'es', labelKey: 'settings.languages.es' },
] as const

const THEMES = [
  { value: 'system', labelKey: 'settings.themes.system' },
  { value: 'light', labelKey: 'settings.themes.light' },
  { value: 'dark', labelKey: 'settings.themes.dark' },
] as const

const selectClass =
  'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm rounded-lg px-3 py-1.5 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-500 cursor-pointer'

const inputClass =
  'w-full bg-neutral-100 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-500'

const sectionLabel = 'text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-2'
const card = 'rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden'
const cardRow = 'flex items-center justify-between px-4 py-3'
const actionBtn = 'inline-flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 px-2.5 py-1.5 rounded-lg transition-colors'

type ApiSource = {
  id: number
  name: string
  url: string
  needsConfiguration: boolean
  apiKey: string | null
}

type ScanFolder = {
  id: number
  path: string
}

type ConfiguringModal = { source: ApiSource; apiKeyInput: string }

type AppConfig = { dbPath: string; dataDir: string }

export function SettingsPage() {
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useTheme()
  const [sources, setSources] = useState<ApiSource[]>([])
  const [modal, setModal] = useState<ConfiguringModal | null>(null)
  const [saving, setSaving] = useState(false)
  const [folders, setFolders] = useState<ScanFolder[]>([])
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null)
  const [actualDbPath, setActualDbPath] = useState<string | null>(null)
  const [restartRequired, setRestartRequired] = useState(false)

  useEffect(() => {
    void (async () => {
      const result = await api['api-sources'].get()
      if (result.data) setSources(result.data as ApiSource[])
    })()
  }, [])

  useEffect(() => {
    void (async () => {
      const result = await api['scan-folders'].get()
      if (result.data) setFolders(result.data as ScanFolder[])
    })()
  }, [])

  useEffect(() => {
    void invoke<AppConfig>('get_config').then(setAppConfig)
  }, [])

  useEffect(() => {
    void api.config.get().then(r => { if (r.data) setActualDbPath(r.data.dbPath) })
  }, [])

  async function changeDataDir() {
    const selected = await open({ directory: true, multiple: false, defaultPath: appConfig?.dataDir })
    if (!selected) return
    try {
      logger.info('Data directory change initiated', { from: appConfig?.dataDir, to: selected })
      await invoke('set_data_dir', {
        newDir: selected as string,
        moveFiles: true,
        currentDbPath: actualDbPath,
      })
      setAppConfig({ dataDir: selected as string, dbPath: `${selected as string}/rmdb.sqlite` })
      setRestartRequired(true)
    } catch (err) {
      logger.error('Failed to change data directory', { error: String(err) })
    }
  }

  function openModal(source: ApiSource) {
    setModal({ source, apiKeyInput: source.apiKey ?? '' })
  }

  async function saveApiKey() {
    if (!modal) return
    setSaving(true)
    const result = await api['api-sources'][String(modal.source.id)].patch({ apiKey: modal.apiKeyInput || null })
    if (result.data) {
      setSources(s => s.map(src => src.id === modal.source.id ? result.data as ApiSource : src))
    }
    setSaving(false)
    setModal(null)
  }

  async function addFolder() {
    const selected = await open({ directory: true, multiple: false })
    if (!selected) return
    const result = await api['scan-folders'].post({ path: selected as string })
    if (result.data) setFolders(f => [...f, result.data as ScanFolder])
  }

  async function removeFolder(id: number) {
    await api['scan-folders'][String(id)].delete()
    setFolders(f => f.filter(folder => folder.id !== id))
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      <h1 className="text-2xl font-bold">{t('settings.title')}</h1>

      {/* Top row: Appearance + Movie Databases side by side */}
      <div className="grid grid-cols-2 gap-4 items-start">

        {/* Appearance */}
        <section className="flex flex-col gap-2">
          <p className={sectionLabel}>{t('settings.appearance')}</p>
          <div className={card}>
            <div className={`${cardRow} border-b border-neutral-100 dark:border-neutral-800`}>
              <span className="text-sm text-neutral-700 dark:text-neutral-300">{t('settings.language')}</span>
              <select
                value={i18n.language}
                onChange={(e) => { localStorage.setItem('language', e.target.value); void i18n.changeLanguage(e.target.value) }}
                className={selectClass}
              >
                {LANGUAGES.map(({ code, labelKey }) => (
                  <option key={code} value={code}>{t(labelKey)}</option>
                ))}
              </select>
            </div>
            <div className={cardRow}>
              <span className="text-sm text-neutral-700 dark:text-neutral-300">{t('settings.theme')}</span>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as Theme)}
                className={selectClass}
              >
                {THEMES.map(({ value, labelKey }) => (
                  <option key={value} value={value}>{t(labelKey)}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Movie Databases */}
        <section className="flex flex-col gap-2">
          <p className={sectionLabel}>{t('settings.movieApis.title')}</p>
          <div className={card}>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {sources.map(source => {
                const isConfigured = !source.needsConfiguration || source.apiKey !== null
                return (
                  <div key={source.id} className={cardRow}>
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {source.name}
                      </span>
                      {!source.needsConfiguration ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          {t('settings.movieApis.free')}
                        </span>
                      ) : isConfigured ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          {t('settings.movieApis.configured')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                          {t('settings.movieApis.notConfigured')}
                        </span>
                      )}
                    </div>
                    {source.needsConfiguration && (
                      <button onClick={() => openModal(source)} className={actionBtn}>
                        <Settings2 size={12} />
                        {t('settings.movieApis.configure')}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </div>

      {/* Scan Folders — full width */}
      <section className="flex flex-col gap-2">
        <p className={sectionLabel}>{t('settings.scanFolders.title')}</p>
        <div className={card}>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {folders.length === 0 ? (
              <div className="px-4 py-3 text-sm text-neutral-400 dark:text-neutral-500">
                {t('settings.scanFolders.empty')}
              </div>
            ) : (
              folders.map(folder => (
                <div key={folder.id} className="flex items-center gap-3 px-4 py-3 group">
                  <FolderOpen size={14} className="text-neutral-400 dark:text-neutral-500 shrink-0" />
                  <span className="flex-1 font-mono text-xs text-neutral-600 dark:text-neutral-400 truncate">
                    {folder.path}
                  </span>
                  <button
                    onClick={() => void removeFolder(folder.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-red-500 dark:hover:text-red-400"
                  >
                    <Trash2 size={13} />
                    {t('settings.scanFolders.remove')}
                  </button>
                </div>
              ))
            )}
            <div className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/40">
              <button
                onClick={() => void addFolder()}
                className="inline-flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                <FolderPlus size={13} />
                {t('settings.scanFolders.add')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Data Directory — full width */}
      {appConfig && (
        <section className="flex flex-col gap-2">
          <div className="flex items-baseline gap-3">
            <p className={sectionLabel}>{t('settings.dataDir.title')}</p>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mb-2">
              {t('settings.dataDir.description')}
            </p>
          </div>
          <div className={card}>
            <div className="flex items-center gap-3 px-4 py-3">
              <HardDrive size={14} className="text-neutral-400 dark:text-neutral-500 shrink-0" />
              <span className="flex-1 font-mono text-xs text-neutral-600 dark:text-neutral-400 truncate">
                {appConfig.dataDir}
              </span>
              <button onClick={() => void changeDataDir()} className={actionBtn}>
                <FolderOpen size={13} />
                {t('settings.dataDir.change')}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Restart notice */}
      {restartRequired && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <span className="text-xs text-amber-700 dark:text-amber-300 flex-1">
            {t('settings.dataDir.restartNotice')}
          </span>
          <button
            onClick={() => void invoke('restart_app')}
            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 transition-colors"
          >
            <RotateCcw size={12} />
            {t('settings.dataDir.restartNow')}
          </button>
        </div>
      )}

      <div className="h-8 shrink-0" />

      {/* Configure modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-sm mx-6 p-6 flex flex-col gap-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white">
                  {t('settings.movieApis.modal.title')}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">{modal.source.name}</p>
              </div>
              <button
                onClick={() => setModal(null)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 block">
                {t('settings.movieApis.modal.apiKeyLabel')}
              </label>
              <input
                autoFocus
                type="password"
                className={inputClass}
                placeholder={t('settings.movieApis.modal.apiKeyPlaceholder')}
                value={modal.apiKeyInput}
                onChange={e => setModal(m => m ? { ...m, apiKeyInput: e.target.value } : m)}
                onKeyDown={e => { if (e.key === 'Enter') void saveApiKey() }}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => void saveApiKey()}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50"
              >
                <Check size={14} />
                {t('settings.movieApis.modal.save')}
              </button>
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
              >
                {t('settings.movieApis.modal.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
