import { runAllTicks } from '@/lib/trading/engine'
import { NextResponse } from 'next/server'

export const runtime  = 'nodejs'
export const maxDuration = 55   // juste sous la limite Vercel Pro (60s)

// Secret header pour sécuriser l'endpoint cron
// Header requis: x-cron-secret: process.env.CRON_SECRET
export async function POST(req: Request) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const results = await runAllTicks()
    return NextResponse.json({ ok: true, ticked: results.length, results })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// Vercel Cron appelle via GET
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const results = await runAllTicks()
    return NextResponse.json({ ok: true, ticked: results.length })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
