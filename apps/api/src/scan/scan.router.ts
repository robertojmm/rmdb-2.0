import { Elysia, t } from 'elysia'
import { readdirSync } from 'node:fs'
import { extname, join, basename } from 'node:path'
import { scanFoldersService } from '../scan-folders/scan-folders.service'
import { apiSourcesService } from '../api-sources/api-sources.service'
import { parseFilename } from './filename-parser'

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
          try {
            // Step 1: collect all video files from configured scan folders
            const folders = await scanFoldersService.findAll()
            const files: string[] = []
            for (const folder of folders) {
              files.push(...collectVideoFiles(folder.path))
            }

            const total = files.length
            controller.enqueue(sse({ type: 'start', total }))

            let found = 0
            let unidentified = 0

            // Step 2: for each file, parse filename and search the selected API
            for (let i = 0; i < files.length; i++) {
              const filePath = files[i]!
              const filename = basename(filePath)
              const { title, year } = parseFilename(filename)

              controller.enqueue(sse({ type: 'progress', current: i + 1, total, file: filename }))

              try {
                const query = year ? `${title} ${year}` : title
                const results = await apiSourcesService.search(sourceId, query)
                const match = results[0]

                if (match) {
                  controller.enqueue(sse({ type: 'result', filePath, match }))
                  found++
                } else {
                  controller.enqueue(sse({ type: 'unidentified', filePath, parsedTitle: title, parsedYear: year }))
                  unidentified++
                }
              } catch {
                controller.enqueue(sse({ type: 'unidentified', filePath, parsedTitle: title, parsedYear: year }))
                unidentified++
              }
            }

            controller.enqueue(sse({ type: 'done', found, unidentified }))
          } catch (err) {
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
