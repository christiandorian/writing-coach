import { NextRequest, NextResponse } from 'next/server'
import openai from '@/lib/openai/client'

export interface FlashcardTerm {
  term: string
  definition: string
}

export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get('title') ?? ''
  const count = Math.min(parseInt(req.nextUrl.searchParams.get('count') ?? '12'), 20)

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [{
        role: 'user',
        content: `Generate ${count} realistic flashcard terms and definitions for a Quizlet set titled: "${title}". Make the terms and definitions academically accurate and appropriate for the subject. Keep definitions concise (1-2 sentences).

Return JSON: { "terms": [{ "term": string, "definition": string }] }`,
      }],
      temperature: 0.7,
    })

    const raw = completion.choices[0].message.content
    if (!raw) throw new Error('Empty response')
    const data = JSON.parse(raw) as { terms: FlashcardTerm[] }
    return NextResponse.json(data.terms)
  } catch (err) {
    console.error('Quizlet set error:', err)
    return NextResponse.json([], { status: 500 })
  }
}
