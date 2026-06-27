'use server'

import { createClient } from '@/lib/supabase/server'
import type { Transaction } from '@/lib/types'

async function callGroq(messages: { role: string; content: string }[], jsonMode = false) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('Groq API key is missing. Please set GROQ_API_KEY in your environment variables.')
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.1,
      response_format: jsonMode ? { type: 'json_object' } : undefined
    }),
    next: { revalidate: 0 } // disable fetch caching
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Groq API error: ${response.status} ${response.statusText} - ${errText}`)
  }

  const data = await response.json()
  return data.choices[0].message.content.trim()
}

export async function getAiVibeCheck() {
  if (!process.env.GROQ_API_KEY) {
    return {
      message: 'AI requires an API key to work. Please set GROQ_API_KEY in your environment variables.',
      type: 'error'
    }
  }

  try {
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

    // Format the transactions into a compact string to save tokens
    const txSummary = transactions.map(t => 
      `${String(t.date).split('T')[0]} | ${t.type} | ${t.category} | ${t.amount} | ${t.note || 'no note'}`
    ).join('\n')

    const systemPrompt = `You are a friendly, concise, and helpful financial assistant integrated into an app called Monolog.
The user wants a very brief "Vibe Check" on their recent spending behavior.
Instructions:
1. Analyze the data briefly.
2. Provide a 1-2 sentence supportive insight, tip, or observation.
3. Keep the tone light, encouraging, and non-judgmental. Do not be overly formal. 
4. Focus on patterns or a notable recent expense.
5. Be very brief (max 25 words).
6. Don't use markdown or bolding, just plain text.`

    const userPrompt = `Here are my recent transactions:
${txSummary}

Give me a vibe check:`

    const text = await callGroq([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ])

    return {
      message: text,
      type: 'success'
    }
  } catch (error: any) {
    console.error('AI Vibe Check Error:', error)
    return {
      message: `AI Error: ${error?.message || 'Unknown error'}`,
      type: 'error'
    }
  }
}

interface MiniItem {
  id: string
  name: string
}

export async function suggestCategoryAndWallet(
  description: string,
  categories: MiniItem[],
  accounts: MiniItem[]
) {
  if (!process.env.GROQ_API_KEY || !description) {
    return null
  }

  try {
    const systemPrompt = `You are an intelligent categorization engine for the Monolog finance app.
Your task is to analyze the user's spending description and match it to the most relevant Category ID and Account ID (Wallet). Also, extract the amount if mentioned.

You must return a JSON object conforming exactly to this schema:
{
  "categoryId": "matched_category_id_or_null",
  "accountId": "matched_account_id_or_null",
  "paymentMethod": "cash" | "card" | "bank_transfer" | null,
  "amount": matched_numeric_amount_or_null
}`

    const userPrompt = `Description: "${description}"

Categories available:
${categories.map(c => `- ID: "${c.id}" | Name: "${c.name}"`).join('\n')}

Accounts (Wallets) available:
${accounts.map(a => `- ID: "${a.id}" | Name: "${a.name}"`).join('\n')}

Rules:
1. If the description matches a category, select the Category ID.
2. If the description suggests a specific wallet account name, select the Account ID.
3. If there is a numeric amount mentioned in the description (e.g. "150", "₱500", "Spent 200"), extract it as a number in the "amount" field.
4. Determine the payment method based on terms like:
   - "cash" -> "cash"
   - "card", "cc", "visa", "mastercard", "credit", "debit" -> "card"
   - "bank", "transfer", "gcash", "wire", "online" -> "bank_transfer"
5. Do not write anything other than the JSON object.`

    const text = await callGroq([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], true)

    console.log('Groq AI Categorization Raw:', text)
    const parsed = JSON.parse(text)
    return {
      categoryId: parsed.categoryId || null,
      accountId: parsed.accountId || null,
      paymentMethod: parsed.paymentMethod || null,
      amount: parsed.amount || null
    }
  } catch (error) {
    console.error('AI Categorization Error:', error)
    return null
  }
}
