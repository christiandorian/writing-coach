import { NextRequest, NextResponse } from 'next/server'
import openai from '@/lib/openai/client'

const SCOPE_BY_MINUTES: Record<number, string> = {
  5:  'very narrow and focused — answerable in roughly 100–150 words',
  10: 'focused — answerable in roughly 150–250 words',
  15: 'moderate scope — answerable in roughly 250–350 words',
  20: 'standard scope — answerable in roughly 300–450 words',
  30: 'broader scope — answerable in roughly 450–600 words',
}

function buildSystemPrompt(category: string, timeLimit: number): string {
  const scope = SCOPE_BY_MINUTES[timeLimit] ?? SCOPE_BY_MINUTES[20]
  return `Generate a single practice writing prompt for the category: ${category}.

The prompt must:
- Be genuinely arguable — reasonable people could disagree
- Require the writer to take a clear stance or recommendation
- Be ${scope} (the writer has ${timeLimit} minutes)
- Be specific enough to require real reasoning (not vague)

Categories and examples:
- General: "Should remote work be a legal right for all knowledge workers?"
- Business: "A startup has $500k in runway and must choose between hiring or marketing. What should they do?"
- Policy: "Should university education be free for all citizens?"
- Ethics: "Is it ethical to use AI to screen job applicants?"
- Case Study: "Acme Corp's best salesperson has been caught falsifying expense reports for 2 years. As the CEO, what do you do?"

Return only the prompt text. No preamble, no quotes, no label.`
}

export async function POST(req: NextRequest) {
  try {
    const { category, sourceText, timeLimit, customContext } = await req.json()

    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }

    let systemPrompt = buildSystemPrompt(category, Number(timeLimit) || 20)

    if (customContext) {
      systemPrompt += `\n\nThe user has provided a custom scenario. Generate a prompt that is directly based on this scenario and requires the writer to take a clear stance:\n\n${String(customContext).slice(0, 2000)}`
    } else if (sourceText) {
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
