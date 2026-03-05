import { join, dirname } from 'node:path'
import { existsSync, mkdirSync, unlinkSync } from 'node:fs'
import sharp from 'sharp'
import { config } from '../config'
import { logger } from '../logger'

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

export async function downloadPoster(movieId: number, url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const raw = Buffer.from(await res.arrayBuffer())
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
