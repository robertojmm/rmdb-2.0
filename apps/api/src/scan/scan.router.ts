import { Elysia, t } from 'elysia'
import { readdirSync } from 'node:fs'
import { extname, join, basename } from 'node:path'
import { scanFoldersService } from '../scan-folders/scan-folders.service'
import { apiSourcesService } from '../api-sources/api-sources.service'
import { parseFilename } from './filename-parser'
import { db } from '@db'
import { movies } from '@db/schema'
import { logger } from '../logger'

const VIDEO_EXTS = new Set([
  '.mkv', '.mp4', '.avi', '.mov', '.wmv', '.m4v', '.flv', '.ts', '.webm', '.divx', '.mpg', '.mpeg',
])

function collectVideoFiles(dir: string): string[] {
  const files: string[] = []
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        files.push(...collectVideoFiles(fullPath))
      } else if (entry.isFile() && VIDEO_EXTS.has(extname(entry.name).toLowerCase())) {
        files.push(fullPath)
      }
    }
  } catch {
    // Skip unreadable directories silently
  }
  return files
}

const enc = new TextEncoder()
function sse(event: object): Uint8Array {
  return enc.encode(`data: ${JSON.stringify(event)}\n\n`)
}

export const scanRouter = new Elysia({ prefix: '/scan' })
  .get(
    '/stream',
    async ({ query: qs }) => {
      const sourceId = Number(qs.sourceId)

      const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
          const scanStart = Date.now()
          try {
            // Step 1: collect all video files from configured scan folders
            const folders = await scanFoldersService.findAll()
            const rawFiles: string[] = []
            for (const folder of folders) {
              rawFiles.push(...collectVideoFiles(folder.path))
            }

            // Deduplicate full paths (handles overlapping scan folders)
            const uniqueFiles = [...new Set(rawFiles)]

            // Skip files already registered in the library
            const existingRows = await db.select({ filePath: movies.filePath }).from(movies)
            const existingPaths = new Set(existingRows.map(r => r.filePath).filter(Boolean))
            const files = uniqueFiles.filter(f => !existingPaths.has(f))

            const total = files.length
            logger.info('Scan started', {
              sourceId,
              folders: folders.length,
              totalFiles: total,
              alreadyInLibrary: uniqueFiles.length - total,
            })
            controller.enqueue(sse({ type: 'start', total }))

            let processed = 0
            let found = 0
            let unidentified = 0

            // Step 2: search files concurrently in batches to avoid hammering the API
            const CONCURRENCY = 5

            async function processFile(filePath: string) {
              const filename = basename(filePath)
              const { title, year } = parseFilename(filename)
              try {
                const query = year ? `${title} ${year}` : title
                const results = await apiSourcesService.search(sourceId, query)
                const match = results[0]
                processed++
                controller.enqueue(sse({ type: 'progress', current: processed, total, file: filename }))
                if (match) {
                  controller.enqueue(sse({ type: 'result', filePath, match }))
                  found++
                } else {
                  controller.enqueue(sse({ type: 'unidentified', filePath, parsedTitle: title, parsedYear: year }))
                  unidentified++
                }
              } catch (err) {
                logger.error('File search failed', { file: filename, sourceId, error: String(err) })
                processed++
                controller.enqueue(sse({ type: 'progress', current: processed, total, file: filename }))
                controller.enqueue(sse({ type: 'unidentified', filePath, parsedTitle: title, parsedYear: year }))
                unidentified++
              }
            }

            for (let i = 0; i < files.length; i += CONCURRENCY) {
              await Promise.all(files.slice(i, i + CONCURRENCY).map(processFile))
            }

            logger.info('Scan completed', {
              found,
              unidentified,
              durationMs: Date.now() - scanStart,
            })
            controller.enqueue(sse({ type: 'done', found, unidentified }))
          } catch (err) {
            logger.error('Scan failed', { error: String(err), durationMs: Date.now() - scanStart })
            controller.enqueue(sse({ type: 'error', message: String(err) }))
          } finally {
            controller.close()
          }
        },
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        },
      })
    },
    {
      query: t.Object({ sourceId: t.String() }),
    },
  )
