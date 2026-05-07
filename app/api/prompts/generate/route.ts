import { NextRequest, NextResponse } from 'next/server'
import openai from '@/lib/openai/client'

const SYSTEM_PROMPT = `Generate a single practice writing prompt for the category: {category}.

The prompt must:
- Be genuinely arguable — reasonable people could disagree
- Require the writer to take a clear stance or recommendation
- Be completable in 20 minutes with 300–500 words
- Be specific enough to require real reasoning (not vague)

Categories and examples:
- General: "Should remote work be a legal right for all knowledge workers?"
- Business: "A startup has $500k in runway and must choose between hiring or marketing. What should they do?"
- Policy: "Should university education be free for all citizens?"
- Ethics: "Is it ethical to use AI to screen job applicants?"
- Case Study: "Acme Corp's best salesperson has been caught falsifying expense reports for 2 years. As the CEO, what do you do?"

Return only the prompt text. No preamble, no quotes, no label.`

export async function POST(req: NextRequest) {
  try {
    const { category, sourceText } = await req.json()

    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }

    let systemPrompt = SYSTEM_PROMPT.replace('{category}', category)

    if (sourceText) {
      systemPrompt += `\n\nThe user has provided the following source material. Generate a prompt that requires the writer to take a position on something directly related to or informed by this material:\n\n${sourceText.slice(0, 4000)}`
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
      ],
      temperature: 0.8,
      max_tokens: 200,
    })

    const prompt = completion.choices[0].message.content?.trim()
    if (!prompt) throw new Error('Empty response from OpenAI')

    return NextResponse.json({ prompt })
  } catch (err) {
    console.error('Prompt generation error:', err)
    return NextResponse.json({ error: 'Failed to generate prompt' }, { status: 500 })
  }
}
