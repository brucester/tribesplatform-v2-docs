import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

function extractJSON(content: string): string {
  const clean = (s: string) => {
    let c = s.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
    // strip leading </think> if think content was in a separate field
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

  // 1. After last </think> tag
  const thinkEnd = content.lastIndexOf('</think>')
  if (thinkEnd >= 0) {
    const after = clean(content.slice(thinkEnd + 8))
    const r = tryParse(after) ?? findLastObject(after)
    if (r) return r
  }

  // 2. Clean full content (strips think blocks + leading </think>)
  const cleaned = clean(content)
  const r2 = tryParse(cleaned) ?? findLastObject(cleaned)
  if (r2) return r2

  // 3. Find last valid {..} anywhere in raw content
  const r3 = findLastObject(content)
  if (r3) return r3

  return content
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
        max_completion_tokens: 1500,
        temperature: 0.1,
        stream: true,
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

  // Stream: collect all SSE chunks, extract content deltas, return complete result
  const stream = new ReadableStream({
    async start(controller) {
      const reader = minimaxRes.body!.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6).trim()
            if (data === '[DONE]') continue
            try {
              const parsed = JSON.parse(data) as { choices?: { delta?: { content?: string } }[] }
              const delta = parsed.choices?.[0]?.delta?.content ?? ''
              if (delta) fullContent += delta
            } catch { /* skip malformed SSE line */ }
          }
        }

        // Extract JSON robustly — handles complete/incomplete <think> blocks
        const result = extractJSON(fullContent)

        const payload = JSON.stringify({ result })
        controller.enqueue(new TextEncoder().encode(payload))
      } catch (e) {
        const payload = JSON.stringify({ error: `Stream error: ${(e as Error).message}` })
        controller.enqueue(new TextEncoder().encode(payload))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'application/json' },
  })
}
