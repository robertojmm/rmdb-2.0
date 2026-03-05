import { useTranslation } from 'react-i18next'
import { version } from '../../../package.json'
import appIcon from '../../../src-tauri/icons/icon.png'

const stack = [
  { label: 'Tauri', url: 'https://tauri.app' },
  { label: 'React', url: 'https://react.dev' },
  { label: 'Bun', url: 'https://bun.sh' },
  { label: 'Elysia', url: 'https://elysiajs.com' },
  { label: 'SQLite', url: 'https://sqlite.org' },
  { label: 'Drizzle ORM', url: 'https://orm.drizzle.team' },
]

export function AboutPage() {
  const { t } = useTranslation()

  return (
    <div className="h-full flex items-center justify-center">
      <div className="flex items-center gap-16 max-w-4xl w-full px-8">
        <img src={appIcon} alt="App icon" className="w-52 h-52 rounded-3xl shadow-2xl shrink-0" />

        <div className="flex flex-col gap-6">
          <div>
            <p className="text-4xl font-bold text-neutral-900 dark:text-white tracking-tight leading-tight">Robert's Movie Database 2.0</p>
            <p className="text-base text-neutral-400 dark:text-neutral-500 mt-2">v{version}</p>
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
        </div>
      </div>
    </div>
  )
}
