import { useTranslation } from 'react-i18next'

export function LibraryPage() {
  const { t } = useTranslation()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('library.title')}</h1>
      <p className="text-neutral-400">{t('library.empty')}</p>
    </div>
  )
}
