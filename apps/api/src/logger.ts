import { appendFileSync, existsSync, mkdirSync, renameSync, statSync, unlinkSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { config } from './config'

const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB per file
const MAX_FILES = Number(process.env['LOG_MAX_FILES'] ?? '10')

const dataDir = resolve(dirname(config.dbPath))
const logsDir = join(dataDir, 'logs')

function logPath(name: 'backend' | 'frontend') {
  return join(logsDir, `${name}.log`)
}

function ensureLogsDir() {
  if (!existsSync(logsDir)) mkdirSync(logsDir, { recursive: true })
}

function rotate(file: string) {
  // Shift: backend.log.N-2 → backend.log.N-1, ..., backend.log → backend.log.1
  for (let i = MAX_FILES - 1; i >= 1; i--) {
    const from = i === 1 ? file : `${file}.${i - 1}`
    const to = `${file}.${i}`
    if (existsSync(from)) {
      if (existsSync(to)) unlinkSync(to)
      renameSync(from, to)
    }
  }
}

function write(name: 'backend' | 'frontend', level: 'INFO' | 'ERROR', message: string, context?: unknown) {
  try {
    ensureLogsDir()
    const file = logPath(name)
    if (existsSync(file) && statSync(file).size >= MAX_SIZE_BYTES) {
      rotate(file)
    }
    const ctx = context !== undefined ? ' ' + JSON.stringify(context) : ''
    const line = `[${new Date().toISOString()}] [${level}] ${message}${ctx}\n`
    appendFileSync(file, line, 'utf-8')
  } catch (err) {
    // Never let the logger crash the app
    console.error('[logger] Failed to write log entry:', err)
  }
}

export const logger = {
  info: (message: string, context?: unknown) => write('backend', 'INFO', message, context),
  error: (message: string, context?: unknown) => write('backend', 'ERROR', message, context),

  frontend: {
    info: (message: string, context?: unknown) => write('frontend', 'INFO', message, context),
    error: (message: string, context?: unknown) => write('frontend', 'ERROR', message, context),
  },
}
