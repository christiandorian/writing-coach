import { NextRequest, NextResponse } from 'next/server'
import openai from '@/lib/openai/client'

export interface QuizletSet {
  id: string
  title: string
  termCount: number
  author: string
}

const POPULAR_PROMPT = `Generate 8 realistic, diverse Quizlet flashcard sets that would be popular for students studying various academic subjects. Cover a mix of sciences, humanities, history, and languages. Each should feel like a real study set a student would share.

Return JSON:
{ "sets": [{ "id": string, "title": string, "termCount": number, "author": string }] }`

const SEARCH_PROMPT = (query: string) => `Generate 8 realistic Quizlet flashcard set results for the search query: "${query}". The titles should be closely related to the query. Mix in different course levels (intro, intermediate, advanced). Term counts should be between 20 and 180.

Return JSON:
{ "sets": [{ "id": string, "title": string, "termCount": number, "author": string }] }`

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q') ?? ''

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: query.trim() ? SEARCH_PROMPT(query) : POPULAR_PROMPT,
        },
      ],
      temperature: 0.9,
    })

    const raw = completion.choices[0].message.content
    if (!raw) throw new Error('Empty response')

    const data = JSON.parse(raw) as { sets: QuizletSet[] }
    return NextResponse.json(data.sets)
  } catch (err) {
    console.error('Quizlet search error:', err)
    return NextResponse.json([], { status: 500 })
  }
}
