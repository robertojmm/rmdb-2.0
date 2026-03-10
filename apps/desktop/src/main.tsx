import React from 'react'
import ReactDOM from 'react-dom/client'
import { invoke } from '@tauri-apps/api/core'
import App from './App'
import './i18n'
import { logger } from './lib/logger'
import { initApiUrl } from './lib/api'

window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection', {
    reason: String(event.reason),
    stack: event.reason instanceof Error ? event.reason.stack : undefined,
  })
})

async function bootstrap() {
  try {
    const cfg = await invoke<{ apiUrl: string }>('get_config')
    initApiUrl(cfg.apiUrl)
  } catch {
    // Running outside Tauri (plain browser dev) — keep the default URL
  }

  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

bootstrap()
