import { useTranslation } from 'react-i18next'
import { version } from '../../../package.json'

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
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-8">{t('about.title')}</h1>

      <div className="max-w-sm space-y-8">
        <div>
          <p className="text-4xl font-bold text-neutral-900 dark:text-white tracking-tight">RMDB</p>
          <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">v{version}</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-3">{t('about.description')}</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
            {t('about.builtWith')}
          </p>
          <div className="flex flex-wrap gap-2">
            {stack.map(({ label }) => (
              <span
                key={label}
                className="text-xs px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
