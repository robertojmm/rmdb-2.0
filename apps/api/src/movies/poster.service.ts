import { join, dirname } from 'node:path'
import { existsSync, mkdirSync, unlinkSync } from 'node:fs'
import { config } from '../config'

export const postersDir = join(dirname(config.dbPath), 'posters')

if (!existsSync(postersDir)) {
  mkdirSync(postersDir, { recursive: true })
}

export async function downloadPoster(movieId: number, url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const buffer = await res.arrayBuffer()
    await Bun.write(join(postersDir, `${movieId}.jpg`), buffer)
    return `/assets/posters/${movieId}.jpg`
  } catch {
    return null
  }
}

export function deletePoster(movieId: number): void {
  const filePath = join(postersDir, `${movieId}.jpg`)
  if (existsSync(filePath)) unlinkSync(filePath)
}
