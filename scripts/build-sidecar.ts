import { execSync } from 'node:child_process'
import { mkdirSync, cpSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const binDir = join('apps', 'desktop', 'src-tauri', 'binaries')
mkdirSync(binDir, { recursive: true })

const ext = process.platform === 'win32' ? '.exe' : ''
const outfile = join(binDir, `rmdb-api${ext}`)

console.log(`Building API binary → ${outfile}`)
execSync(
  `bun build --compile --external=sharp apps/api/src/index.ts --outfile "${outfile}"`,
  { stdio: 'inherit' }
)

// sharp uses native binaries (.node files) that cannot be embedded in the compiled
// executable — copy the package alongside so Bun can load it at runtime.
const sharpSrc =
  existsSync(join('apps', 'api', 'node_modules', 'sharp'))
    ? join('apps', 'api', 'node_modules', 'sharp')
    : join('node_modules', 'sharp')
const sharpDst = join(binDir, 'node_modules', 'sharp')
if (existsSync(sharpSrc)) {
  console.log(`Copying sharp native module → ${sharpDst}`)
  cpSync(sharpSrc, sharpDst, { recursive: true })
} else {
  console.error('ERROR: node_modules/sharp not found. Run bun install first.')
  process.exit(1)
}

console.log(`Done`)
