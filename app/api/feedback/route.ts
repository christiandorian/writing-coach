import { NextRequest, NextResponse } from 'next/server'
import openai from '@/lib/openai/client'
import { createClient } from '@/lib/supabase/server'
import type { FeedbackResponse } from '@/lib/types'

const SYSTEM_PROMPT = `You are a rigorous thinking coach, not a writing assistant. Your job is to evaluate the quality of the user's reasoning — not their prose style or grammar.

You will receive:
1. The original prompt they were asked to respond to
2. The position they declared before writing
3. Their full written response

Evaluate their response across exactly these 5 dimensions. For each dimension, return:
- score: integer from 1 to 10
- diagnosis: 2-3 sentences explaining what you observed, referencing specific parts of their response
- suggestion: one concrete, actionable thing they should do differently next time

Dimensions:
1. position_clarity — Is there a clear, unambiguous thesis that directly answers the prompt?
2. argument_structure — Is the response logically organized with clear progression?
3. logical_consistency — Do the points build on each other without contradiction?
4. use_of_evidence — Are claims supported with reasoning, examples, or evidence?
5. tradeoff_awareness — Did the writer acknowledge counterarguments, risks, or limitations?

CRITICAL RULES:
- NEVER rewrite any part of the user's response
- NEVER say "here is a better version" or offer edited text
- NEVER praise the writing style, grammar, or vocabulary
- ALWAYS reference specific sentences or phrases from their response when diagnosing
- Be honest and direct. Do not soften feedback to be encouraging.
- Your goal is to make them think differently, not feel better.

Return your response as valid JSON only. No preamble, no markdown.

Schema:
{
  "dimensions": {
    "position_clarity": { "score": number, "diagnosis": string, "suggestion": string },
    "argument_structure": { "score": number, "diagnosis": string, "suggestion": string },
    "logical_consistency": { "score": number, "diagnosis": string, "suggestion": string },
    "use_of_evidence": { "score": number, "diagnosis": string, "suggestion": string },
    "tradeoff_awareness": { "score": number, "diagnosis": string, "suggestion": string }
  },
  "overall_score": number,
  "coach_note": string
}`

export async function POST(req: NextRequest) {
  try {
    const { prompt, position, response, time_taken_seconds, session_id, version = 1 } = await req.json()

    if (!prompt || !response) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const userMessage = [
      `PROMPT: ${prompt}`,
      position ? `\nDECLARED POSITION: ${position}` : '',
      `\nWRITTEN RESPONSE:\n${response}`,
    ].join('')

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
    })

    const raw = completion.choices[0].message.content
    if (!raw) throw new Error('Empty response from OpenAI')

    const feedback = JSON.parse(raw) as FeedbackResponse

    const supabase = createClient()

    if (session_id) {
      const { error } = await supabase.from('feedback').insert({
        session_id,
        version,
        position_clarity_score: feedback.dimensions.position_clarity.score,
        position_clarity_diagnosis: feedback.dimensions.position_clarity.diagnosis,
        position_clarity_suggestion: feedback.dimensions.position_clarity.suggestion,
        argument_structure_score: feedback.dimensions.argument_structure.score,
        argument_structure_diagnosis: feedback.dimensions.argument_structure.diagnosis,
        argument_structure_suggestion: feedback.dimensions.argument_structure.suggestion,
        logical_consistency_score: feedback.dimensions.logical_consistency.score,
        logical_consistency_diagnosis: feedback.dimensions.logical_consistency.diagnosis,
        logical_consistency_suggestion: feedback.dimensions.logical_consistency.suggestion,
        use_of_evidence_score: feedback.dimensions.use_of_evidence.score,
        use_of_evidence_diagnosis: feedback.dimensions.use_of_evidence.diagnosis,
        use_of_evidence_suggestion: feedback.dimensions.use_of_evidence.suggestion,
        tradeoff_awareness_score: feedback.dimensions.tradeoff_awareness.score,
        tradeoff_awareness_diagnosis: feedback.dimensions.tradeoff_awareness.diagnosis,
        tradeoff_awareness_suggestion: feedback.dimensions.tradeoff_awareness.suggestion,
        overall_score: feedback.overall_score,
        coach_note: feedback.coach_note,
      })

      if (error) console.error('Supabase insert error:', error)
    }

    return NextResponse.json(feedback)
  } catch (err) {
    console.error('Feedback API error:', err)
    return NextResponse.json({ error: 'Failed to generate feedback' }, { status: 500 })
  }
}
