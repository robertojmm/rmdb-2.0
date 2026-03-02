import { useTranslation } from 'react-i18next'

export function AddMoviePage() {
  const { t } = useTranslation()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('addMovie.title')}</h1>
    </div>
  )
}
