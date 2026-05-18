import { NextRequest, NextResponse } from 'next/server'
import openai from '@/lib/openai/client'

export async function POST(req: NextRequest) {
  const { content, name } = await req.json()

  const text = (content ?? '').trim() || (name ?? '')
  const excerpt = text.slice(0, 3000)

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a concept tagger for academic source documents. Given source text or a document title, return two categories of tags combined into one flat list:

1. SUBJECT AREA TAGS (always required) — 5–8 high-level disciplines or themes the content belongs to (e.g. "Nutrition", "Public Health", "Critical Reasoning", "Environmental Science"). These must be broad parent-level categories, not specific details, named entities, or verbatim phrases from the text.

2. COURSE METADATA (only if present) — Extract any of the following if they are explicitly mentioned in the text or title:
   - Semester / term (e.g. "Fall 2019", "Spring 2024")
   - Course code (e.g. "BIO 110", "CHEM 201", "HIST 305")
   - Course name (e.g. "Integrative Biology I", "Organic Chemistry")
   Do not invent course metadata. Only include it when clearly stated in the source.

3. STANDARDIZED TESTS (only if present) — If the source is a practice prompt, excerpt, or prep material for a standardized test, include the test name as a tag (e.g. "GRE", "SAT", "ACT", "AP", "GMAT", "LSAT", "MCAT", "MAP", "CogAT", "IELTS", "TOEFL"). Only include when the test is explicitly mentioned or the content is clearly identifiable as prep material for a known exam.

Return ONLY a JSON object with a single key "tags" whose value is a flat array of all tag strings. No explanations.`,
      },
      {
        role: 'user',
        content: excerpt || 'No content available — title: ' + name,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 300,
  })

  let tags: string[] = []
  try {
    const parsed = JSON.parse(completion.choices[0].message.content ?? '{}')
    tags = Array.isArray(parsed.tags) ? parsed.tags : Object.values(parsed).flat() as string[]
  } catch {
    tags = []
  }

  return NextResponse.json({ tags })
}
