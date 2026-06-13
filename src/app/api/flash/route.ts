import { NextRequest } from 'next/server'
import { EventEmitter } from 'events'

const g = global as typeof global & { __flashEmitter?: EventEmitter }
if (!g.__flashEmitter) g.__flashEmitter = new EventEmitter()
const flashEmitter = g.__flashEmitter
flashEmitter.setMaxListeners(50)

const SECRET = process.env.FLASH_SECRET ?? 'anne2024'

export async function GET(req: NextRequest) {
  const secret = new URL(req.url).searchParams.get('s')
  if (secret !== SECRET) return new Response('Yetkisiz', { status: 401 })

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(': connected\n\n'))

      const onFlash = () => {
        try {
          controller.enqueue(encoder.encode('data: flash\n\n'))
        } catch {}
      }

      flashEmitter.on('flash', onFlash)
      req.signal.addEventListener('abort', () => {
        flashEmitter.off('flash', onFlash)
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}

export async function POST(req: NextRequest) {
  const secret = new URL(req.url).searchParams.get('s')
  if (secret !== SECRET) return new Response('Yetkisiz', { status: 401 })
  flashEmitter.emit('flash')
  return Response.json({ ok: true })
}
