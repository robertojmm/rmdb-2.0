import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { version } from '../../../package.json'
import appIcon from '../../../src-tauri/icons/icon.png'
import { api } from '../../lib/api'

const stack = [
  { label: 'Tauri', url: 'https://tauri.app' },
  { label: 'React', url: 'https://react.dev' },
  { label: 'Bun', url: 'https://bun.sh' },
  { label: 'Elysia', url: 'https://elysiajs.com' },
  { label: 'SQLite', url: 'https://sqlite.org' },
  { label: 'Drizzle ORM', url: 'https://orm.drizzle.team' },
]

type ServerStatus = 'checking' | 'online' | 'offline'

export function AboutPage() {
  const { t } = useTranslation()
  const [serverStatus, setServerStatus] = useState<ServerStatus>('checking')
  const [serverVersion, setServerVersion] = useState<string | null>(null)

  useEffect(() => {
    void api.health.get().then(result => {
      if (result.error) {
        setServerStatus('offline')
      } else {
        setServerStatus('online')
        setServerVersion(result.data.version)
      }
    })
  }, [])

  return (
    <div className="h-full flex items-center justify-center">
      <div className="flex items-center gap-16 max-w-4xl w-full px-8">
        <img src={appIcon} alt="App icon" className="w-52 h-52 rounded-3xl shadow-2xl shrink-0" />

        <div className="flex flex-col gap-6">
          <div>
            <p className="text-4xl font-bold text-neutral-900 dark:text-white tracking-tight leading-tight">Robert's Movie Database 2.0</p>
          </div>

          <p className="text-base text-neutral-600 dark:text-neutral-300 leading-relaxed">{t('about.description')}</p>

          <div>
            <p className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-3">
              {t('about.builtWith')}
            </p>
            <div className="flex flex-wrap gap-2">
              {stack.map(({ label }) => (
                <span
                  key={label}
                  className="text-sm px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-5 flex flex-col gap-2">
            <div className="flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
              <span>{t('about.clientVersion')}: <span className="font-mono text-neutral-700 dark:text-neutral-300">v{version}</span></span>
              <span className="text-neutral-300 dark:text-neutral-700">|</span>
              <span>
                {t('about.serverVersion')}:{' '}
                <span className="font-mono text-neutral-700 dark:text-neutral-300">
                  {serverStatus === 'checking' ? '…' : serverStatus === 'online' ? `v${serverVersion}` : t('about.serverUnreachable')}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className={`w-2 h-2 rounded-full shrink-0 ${
                serverStatus === 'checking' ? 'bg-neutral-400 animate-pulse' :
                serverStatus === 'online' ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className={
                serverStatus === 'checking' ? 'text-neutral-400' :
                serverStatus === 'online' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
              }>
                {t(`about.server.${serverStatus}`)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
