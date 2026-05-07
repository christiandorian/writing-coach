import { NextRequest, NextResponse } from 'next/server'
import openai from '@/lib/openai/client'

export async function POST(req: NextRequest) {
  try {
    const { message, sourceText } = await req.json()

    const systemPrompt = sourceText
      ? `You are a helpful study assistant. The user has provided the following source material:\n\n${sourceText.slice(0, 8000)}\n\nAnswer questions about this material concisely. You can also help them think through arguments, clarify concepts, or explore different perspectives.`
      : `You are a helpful study and writing assistant. Help the user think through arguments, clarify concepts, and explore different perspectives. Be concise and direct.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    const reply = completion.choices[0].message.content?.trim()
    return NextResponse.json({ reply })
  } catch (err) {
    console.error('Chat API error:', err)
    return NextResponse.json({ error: 'Failed to generate reply' }, { status: 500 })
  }
}
