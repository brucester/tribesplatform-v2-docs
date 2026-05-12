import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 90

function extractJSON(content: string): string | null {
  const clean = (s: string) => {
    let c = s.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
    if (c.startsWith('</think>')) c = c.slice(8).trim()
    if (c.startsWith('```')) c = c.replace(/^```(json)?\s*/, '').replace(/```\s*$/, '').trim()
    return c
  }
  const tryParse = (s: string) => { try { JSON.parse(s); return s } catch { return null } }
  const findLastObject = (s: string) => {
    for (let e = s.length - 1; e >= 0; e--) {
      if (s[e] !== '}') continue
      for (let st = 0; st <= e; st++) {
        if (s[st] !== '{') continue
        const candidate = s.slice(st, e + 1)
        if (tryParse(candidate)) return candidate
      }
    }
    return null
  }

  // 1. After last </think>
  const thinkEnd = content.lastIndexOf('</think>')
  if (thinkEnd >= 0) {
    const after = clean(content.slice(thinkEnd + 8))
    const r = tryParse(after) ?? findLastObject(after)
    if (r) return r
  }

  // 2. Clean full content (strips complete think blocks)
  const cleaned = clean(content)
  const r2 = tryParse(cleaned) ?? findLastObject(cleaned)
  if (r2) return r2

  // 3. Find last valid {...} anywhere in raw content
  const r3 = findLastObject(content)
  if (r3) return r3

  return null
}

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
        messages: [
          {
            role: 'system',
            content: 'You are a JSON extraction API. Output ONLY a valid JSON object — no markdown fences. Your entire response must be a single JSON object starting with { and ending with }.',
          },
          { role: 'user', content: prompt },
        ],
        max_completion_tokens: 4096,
        temperature: 0.1,
      }),
    })
  } catch (e) {
    return NextResponse.json({ error: `Network error: ${(e as Error).message}` }, { status: 502 })
  }

  if (minimaxRes.status === 429) {
    return NextResponse.json({ error: 'MiniMax rate limit reached. Please try again in a few hours.' }, { status: 429 })
  }

  if (!minimaxRes.ok) {
    const rawText = await minimaxRes.text()
    let detail = rawText.slice(0, 400)
    try { detail = (JSON.parse(rawText) as { error?: { message?: string } })?.error?.message ?? detail } catch { /* raw */ }
    return NextResponse.json({ error: `MiniMax error: ${detail}` }, { status: 502 })
  }

  const data = await minimaxRes.json() as { choices?: { message?: { content?: string } }[] }
  const rawContent = data.choices?.[0]?.message?.content ?? ''
  const result = extractJSON(rawContent)

  if (!result) {
    return NextResponse.json(
      { error: "We're working on our scanning process, thanks for the patience. Try again later please." },
      { status: 502 }
    )
  }

  return NextResponse.json({ result })
}
