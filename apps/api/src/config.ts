import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

type AppConfig = {
  dbPath: string
}

function getTauriConfigPath(): string | null {
  const { platform, env } = process
  if (platform === 'win32' && env['APPDATA'])
    return join(env['APPDATA'], 'com.rmdb.desktop', 'config.json')
  if (platform === 'darwin' && env['HOME'])
    return join(env['HOME'], 'Library', 'Application Support', 'com.rmdb.desktop', 'config.json')
  if (env['HOME'])
    return join(env['HOME'], '.config', 'com.rmdb.desktop', 'config.json')
  return null
}

function tryReadConfig(path: string): AppConfig | null {
  if (!existsSync(path)) return null
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf-8')) as { dbPath?: string }
    if (parsed.dbPath) return { dbPath: parsed.dbPath }
  } catch { /* ignore malformed file */ }
  return null
}

function loadConfig(): AppConfig {
  // 1. Explicit CONFIG_PATH (set by Tauri when launching Bun as sidecar in prod)
  const configPathEnv = process.env['CONFIG_PATH']
  if (configPathEnv) {
    const cfg = tryReadConfig(configPathEnv)
    if (cfg) {
      console.log(`[config] Loaded from CONFIG_PATH env var: ${configPathEnv}`)
      console.log(`[config] DB path: ${cfg.dbPath}`)
      return cfg
    }
  }

  // 2. Tauri app config dir (works in dev after user has changed the data dir via Settings)
  const tauriConfigPath = getTauriConfigPath()
  if (tauriConfigPath) {
    const cfg = tryReadConfig(tauriConfigPath)
    if (cfg) {
      console.log(`[config] Loaded from Tauri app config dir: ${tauriConfigPath}`)
      console.log(`[config] DB path: ${cfg.dbPath}`)
      return cfg
    }
  }

  // 3. Fallback: SQLITE_PATH env var from .env (default dev mode)
  const dbPath = process.env['SQLITE_PATH']
  if (!dbPath) throw new Error('SQLITE_PATH or CONFIG_PATH must be defined')
  console.log(`[config] Loaded from SQLITE_PATH env var (.env fallback)`)
  console.log(`[config] DB path: ${dbPath}`)
  return { dbPath }
}

export const config = loadConfig()
