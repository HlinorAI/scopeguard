import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const output = resolve(process.cwd(), 'dist/server/index.js')
const htmlPath = resolve(process.cwd(), 'dist/index.html')
const assetsPath = resolve(process.cwd(), 'dist/assets')
const assets = await readdir(assetsPath)
const scriptFile = assets.find((file) => file.endsWith('.js'))
const styleFile = assets.find((file) => file.endsWith('.css'))

if (!scriptFile || !styleFile) throw new Error('Vite assets were not found')

const scriptPath = resolve(assetsPath, scriptFile)
const stylePath = resolve(assetsPath, styleFile)

const htmlTemplate = await readFile(htmlPath, 'utf8')
const script = (await readFile(scriptPath, 'utf8')).replaceAll('</script', '<\\/script')
const styles = await readFile(stylePath, 'utf8')
const html = htmlTemplate
  .replace(new RegExp(`<script type="module" crossorigin src="/assets/${scriptFile}"></script>`), () => `<script type="module">${script}</script>`)
  .replace(new RegExp(`<link rel="stylesheet" crossorigin href="/assets/${styleFile}">`), () => `<style>${styles}</style>`)

const worker = `const html = ${JSON.stringify(html)}

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405 })
    }
    if (url.pathname !== '/' && url.pathname !== '/index.html') {
      return new Response('Not found', { status: 404 })
    }

    return new Response(html, {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    })
  },
}

export default worker
`

await mkdir(dirname(output), { recursive: true })
await writeFile(output, worker, 'utf8')
