import { getApiUrl } from './api'

type Level = 'INFO' | 'ERROR'

function write(level: Level, message: string, context?: unknown): void {
  // Fire-and-forget — never throws, never blocks
  void fetch(`${getApiUrl()}/log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level, message, context }),
  }).catch(() => {
    // API unreachable — silently swallow so the logger never causes secondary errors
  })
}

export const logger = {
  info: (message: string, context?: unknown) => write('INFO', message, context),
  error: (message: string, context?: unknown) => write('ERROR', message, context),
}
