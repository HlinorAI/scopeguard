import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const output = resolve(process.cwd(), 'dist/server/index.js')

const worker = `const worker = {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request)
    if (response.status !== 404) return response

    const url = new URL(request.url)
    if (request.method !== 'GET' && request.method !== 'HEAD') return response
    if (url.pathname.startsWith('/assets/')) return response

    return env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request))
  },
}

export default worker
`

await mkdir(dirname(output), { recursive: true })
await writeFile(output, worker, 'utf8')
