'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import type { Transaction } from '@/lib/types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function getAiVibeCheck() {
  if (!process.env.GEMINI_API_KEY) {
    return {
      message: 'AI requires an API key to work. Please set GEMINI_API_KEY in your environment variables.',
      type: 'error'
    }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch recent transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(10)

  if (!transactions || transactions.length === 0) {
    return null
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
    
    // Format the transactions into a compact string to save tokens
    const txSummary = transactions.map(t => 
      `${String(t.date).split('T')[0]} | ${t.type} | ${t.category} | ${t.amount} | ${t.note || 'no note'}`
    ).join('\n')

    const prompt = `
    You are a friendly, concise, and helpful financial assistant integrated into an app called Monolog.
    The user wants a very brief "Vibe Check" on their recent spending behavior.
    
    Here are their recent transactions:
    ${txSummary}
    
    Instructions:
    1. Analyze the data briefly.
    2. Provide a 1-2 sentence supportive insight, tip, or observation.
    3. Keep the tone light, encouraging, and non-judgmental. Do not be overly formal. 
    4. Focus on patterns or a notable recent expense.
    5. Be very brief (max 25 words).
    6. Don't use markdown or bolding, just plain text.
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text().trim()

    return {
      message: text,
      type: 'success'
    }
  } catch (error: any) {
    console.error('AI Error:', error)
    return {
      message: `AI Error: ${error?.message || 'Unknown error'}`,
      type: 'error'
    }
  }
}
