import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'en', labelKey: 'settings.languages.en' },
  { code: 'es', labelKey: 'settings.languages.es' },
] as const

export function SettingsPage() {
  const { t, i18n } = useTranslation()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('settings.title')}</h1>

      <section className="max-w-sm">
        <label className="block text-sm text-neutral-400 mb-2">
          {t('settings.language')}
        </label>
        <div className="flex gap-2">
          {LANGUAGES.map(({ code, labelKey }) => (
            <button
              key={code}
              onClick={() => void i18n.changeLanguage(code)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                i18n.language === code
                  ? 'bg-white text-neutral-900 font-medium'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
