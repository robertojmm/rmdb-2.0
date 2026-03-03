import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type Theme, useTheme } from '../../context/ThemeContext'
import { api } from '../../lib/api'

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
  'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm rounded-lg px-3 py-2 border border-neutral-300 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-500 cursor-pointer'

type ApiStatus = 'checking' | 'online' | 'offline'

export function SettingsPage() {
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useTheme()
  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking')
  const [apiVersion, setApiVersion] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const result = await api.health.get()
      if (!cancelled) {
        setApiStatus(result.error ? 'offline' : 'online')
        setApiVersion(result.error ? null : result.data.version)
      }
    })()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-6">{t('settings.title')}</h1>

      <div className="divide-y divide-neutral-200 dark:divide-neutral-800 max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between py-4">
          <span className="text-sm text-neutral-600 dark:text-neutral-300">{t('settings.language')}</span>
          <select
            value={i18n.language}
            onChange={(e) => void i18n.changeLanguage(e.target.value)}
            className={selectClass}
          >
            {LANGUAGES.map(({ code, labelKey }) => (
              <option key={code} value={code}>
                {t(labelKey)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between py-4">
          <span className="text-sm text-neutral-600 dark:text-neutral-300">{t('settings.theme')}</span>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as Theme)}
            className={selectClass}
          >
            {THEMES.map(({ value, labelKey }) => (
              <option key={value} value={value}>
                {t(labelKey)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="max-w-lg mx-auto w-full mt-auto pt-6 border-t border-neutral-200 dark:border-neutral-800">
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-2">{t('settings.apiStatus.label')}</p>
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${apiStatus === 'checking'
              ? 'bg-neutral-400 animate-pulse'
              : apiStatus === 'online'
                ? 'bg-green-500'
                : 'bg-red-500'
              }`}
          />
          <span className="text-sm text-neutral-600 dark:text-neutral-300">
            {`${t(`settings.apiStatus.${apiStatus}`)}${apiStatus === 'online' ? ` - v${apiVersion}` : ''}`}
          </span>
        </div>
      </div>
    </div>
  )
}
