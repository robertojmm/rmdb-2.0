import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './i18n'
import { logger } from './lib/logger'

window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection', {
    reason: String(event.reason),
    stack: event.reason instanceof Error ? event.reason.stack : undefined,
  })
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
