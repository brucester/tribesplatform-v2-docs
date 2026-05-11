import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  const apiKey = process.env.MINIMAX_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'MINIMAX_API_KEY not configured.' }, { status: 500 })
  }

  let body: { prompt?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { prompt } = body
  if (!prompt || typeof prompt !== 'string') {
    return NextResponse.json({ error: 'Missing prompt' }, { status: 400 })
  }

  let minimaxRes: Response
  try {
    minimaxRes = await fetch('https://api.minimax.io/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.7',
        messages: [{ role: 'user', content: prompt }],
        max_completion_tokens: 2048,
        temperature: 0.3,
      }),
    })
  } catch (e) {
    return NextResponse.json({ error: `Network error: ${(e as Error).message}` }, { status: 502 })
  }

  const rawText = await minimaxRes.text()

  if (!minimaxRes.ok) {
    return NextResponse.json({ error: `MiniMax error ${minimaxRes.status}: ${rawText.slice(0, 400)}` }, { status: 502 })
  }

  let data: { choices?: { message?: { content?: string } }[] }
  try {
    data = JSON.parse(rawText)
  } catch {
    return NextResponse.json({ error: `Non-JSON response: ${rawText.slice(0, 400)}` }, { status: 502 })
  }

  const result = data.choices?.[0]?.message?.content ?? ''
  if (!result) {
    return NextResponse.json({ error: `Empty result from MiniMax.` }, { status: 502 })
  }

  return NextResponse.json({ result })
}
