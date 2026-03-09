import { join, dirname } from 'node:path'
import { existsSync, mkdirSync, unlinkSync } from 'node:fs'
import type sharpDefault from 'sharp'
import { config } from '../config'
import { logger } from '../logger'

type SharpFn = typeof sharpDefault

export const postersDir = join(dirname(config.dbPath), 'posters')

if (!existsSync(postersDir)) {
  mkdirSync(postersDir, { recursive: true })
}

const SIZES = {
  small: 185,
  medium: 342,
  big: 780,
} as const

type PosterSize = keyof typeof SIZES

// In a compiled Bun binary on Windows, --external module resolution uses a
// virtual path (B:/~BUN/root/) instead of the real exe location, so the
// adjacent node_modules/sharp is never found. Load it via the real exe path.
let _sharp: SharpFn | null = null

async function loadSharp(): Promise<SharpFn> {
  if (_sharp) return _sharp
  const exeDir = dirname(process.execPath)
  const sharpPath = join(exeDir, 'node_modules', 'sharp')
  if (existsSync(sharpPath)) {
    try {
      const mod = await import(sharpPath) as { default: SharpFn }
      _sharp = mod.default
      return _sharp
    } catch (_err) {
      // fall through to regular import
    }
  }
  // Dev mode (bun run dev): resolve normally from node_modules
  const mod = await import('sharp')
  _sharp = mod.default
  return _sharp
}

export async function downloadPoster(movieId: number, url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const raw = Buffer.from(await res.arrayBuffer())
    const sharp = await loadSharp()
    for (const [size, width] of Object.entries(SIZES) as [PosterSize, number][]) {
      const buf = await sharp(raw).resize(width).jpeg({ quality: 85 }).toBuffer()
      await Bun.write(join(postersDir, `${movieId}_${size}.jpg`), buf)
    }
    return `/assets/posters/${movieId}`
  } catch (err) {
    logger.error('Poster download failed', { movieId, url, error: String(err) })
    return null
  }
}

export function deletePoster(movieId: number): void {
  for (const size of Object.keys(SIZES) as PosterSize[]) {
    const filePath = join(postersDir, `${movieId}_${size}.jpg`)
    if (existsSync(filePath)) unlinkSync(filePath)
  }
}
