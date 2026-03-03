import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FilePen, Globe, FolderSearch, ChevronRight } from 'lucide-react'
import { ManualPanel } from './ManualPanel'
import { ApiPanel } from './ApiPanel'
import { ScanPanel } from './ScanPanel'

type AddMethod = 'manual' | 'api' | 'search'

const methods: { id: AddMethod; icon: typeof FilePen; titleKey: string; descKey: string }[] = [
  { id: 'manual', icon: FilePen, titleKey: 'addMovie.manual.title', descKey: 'addMovie.manual.desc' },
  { id: 'api',    icon: Globe,   titleKey: 'addMovie.api.title',    descKey: 'addMovie.api.desc'    },
  { id: 'search', icon: FolderSearch, titleKey: 'addMovie.search.title', descKey: 'addMovie.search.desc' },
]

export function AddMoviePage() {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<AddMethod | null>(null)

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-2">{t('addMovie.title')}</h1>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-8">
        {t('addMovie.subtitle')}
      </p>

      <div className="grid grid-cols-3 gap-4">
        {methods.map(({ id, icon: Icon, titleKey, descKey }) => {
          const isSelected = selected === id
          return (
            <button
              key={id}
              onClick={() => setSelected(id)}
              className={[
                'group relative flex flex-col gap-5 p-6 rounded-2xl border text-left',
                'transition-all duration-200 cursor-pointer',
                isSelected
                  ? 'bg-neutral-900 dark:bg-white border-neutral-900 dark:border-white'
                  : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600',
              ].join(' ')}
            >
              <div className={[
                'self-start p-3 rounded-xl transition-colors duration-200',
                isSelected ? 'bg-white/15 dark:bg-black/10' : 'bg-neutral-100 dark:bg-neutral-800',
              ].join(' ')}>
                <Icon
                  size={22}
                  className={isSelected ? 'text-white dark:text-neutral-900' : 'text-neutral-600 dark:text-neutral-300'}
                />
              </div>

              <div>
                <p className={[
                  'font-semibold mb-1',
                  isSelected ? 'text-white dark:text-neutral-900' : 'text-neutral-900 dark:text-white',
                ].join(' ')}>
                  {t(titleKey)}
                </p>
                <p className={[
                  'text-sm',
                  isSelected ? 'text-neutral-400 dark:text-neutral-500' : 'text-neutral-500 dark:text-neutral-400',
                ].join(' ')}>
                  {t(descKey)}
                </p>
              </div>

              <ChevronRight
                size={16}
                className={[
                  'absolute bottom-5 right-5 transition-all duration-200',
                  isSelected
                    ? 'opacity-100 translate-x-0 text-neutral-400 dark:text-neutral-500'
                    : 'opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 text-neutral-400',
                ].join(' ')}
              />
            </button>
          )
        })}
      </div>

      {selected && (
        <div className={`mt-6${selected === 'search' ? ' flex-1 flex flex-col min-h-0' : ''}`}>
          {selected === 'manual' && <ManualPanel />}
          {selected === 'api'    && <ApiPanel />}
          {selected === 'search' && <ScanPanel />}
        </div>
      )}
    </div>
  )
}
