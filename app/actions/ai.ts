'use server'

import { createClient } from '@/lib/supabase/server'
import type { Transaction } from '@/lib/types'
import { getBalance } from '@/app/actions'

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
      .select('*, category:categories(name)')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(30)

    const { data: budgets } = await supabase
      .from('budgets')
      .select('*, category:categories(name)')
      .eq('user_id', user.id)

    if (!transactions || transactions.length === 0) {
      return null
    }

    // Format the transactions into a compact string to save tokens
    const txSummary = transactions.map(t => 
      `${String(t.date).split('T')[0]} | ${t.type} | ${t.category?.name || 'Uncategorized'} | ${t.amount} | ${t.description || 'no note'}`
    ).join('\n')

    const budgetSummary = budgets && budgets.length > 0 
      ? budgets.map(b => `Category: ${b.category?.name} | Monthly Limit: ${b.amount}`).join('\n')
      : 'No budgets set.'

    const systemPrompt = `You are a friendly, concise, and helpful financial assistant integrated into an app called Monolog.
The user wants a very brief "Vibe Check" on their recent spending behavior and budget pacing.
Instructions:
1. Analyze the data briefly. Compare their spending against their monthly budgets if any are set.
2. Provide a 1-2 sentence supportive insight, tip, or observation.
3. Keep the tone light, encouraging, and non-judgmental. If they are blowing their budget, gently roast or warn them. 
4. Focus on patterns or budget pacing.
5. Be very brief (max 30 words).
6. Don't use markdown or bolding, just plain text.`

    const userPrompt = `Here are my recent transactions:
${txSummary}

My Monthly Budgets:
${budgetSummary}

Give me a vibe check on my budget pacing:`

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

async function callGroqVision(messages: any[]) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('Groq API key is missing.')

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.2-11b-vision-preview',
      messages,
      temperature: 0.1,
      response_format: { type: 'json_object' }
    }),
    next: { revalidate: 0 }
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Groq Vision API error: ${response.status} - ${errText}`)
  }

  const data = await response.json()
  return data.choices[0].message.content.trim()
}

export async function scanReceipt(base64Image: string) {
  try {
    const systemPrompt = `You are a receipt scanner. Extract the total amount, merchant/description, and suggest a generic category (e.g., Food, Groceries, Transport, Shopping).
Return a JSON object: { "amount": number, "description": "string", "suggestedCategory": "string", "paymentMethod": "card" | "cash" }`

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: [
          { type: 'text', text: 'Extract details from this receipt.' },
          { type: 'image_url', image_url: { url: base64Image } }
        ]
      }
    ]

    const text = await callGroqVision(messages)
    return JSON.parse(text)
  } catch (err) {
    console.error('Receipt Scan Error:', err)
    return null
  }
}

export async function detectSubscriptions() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Fetch last 90 days of transactions
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', ninetyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false })

    if (!transactions || transactions.length === 0) return []

    const txSummary = transactions.map((t: any) => 
      `${t.date} | ${t.description || 'Unknown'} | ${t.amount} | ${t.category_id} | ${t.account_id}`
    ).join('\n')

    const systemPrompt = `You are a financial analyst. Find recurring subscriptions/bills in these transactions.
Look for identical amounts and similar descriptions that happen roughly on the same day across different months, or multiple times.
Return a JSON object with a "subscriptions" array: { "subscriptions": [ { "description": "Netflix", "amount": 15, "recurrence_day": 12, "category_id": "...", "account_id": "...", "type": "expense", "payment_method": "card" } ] }
If none found, return { "subscriptions": [] }`

    const text = await callGroq([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Transactions:\n${txSummary}` }
    ], true)

    const result = JSON.parse(text).subscriptions || []

    // Insert detected subscriptions into recurring_transactions
    if (result.length > 0) {
      for (const sub of result) {
        // Check if it already exists to prevent duplicates
        const { data: existing } = await supabase
          .from('recurring_transactions')
          .select('id')
          .eq('user_id', user.id)
          .eq('description', sub.description)
          .eq('amount', sub.amount)
          .single()

        if (!existing) {
          await supabase.from('recurring_transactions').insert({
            user_id: user.id,
            amount: sub.amount,
            type: sub.type || 'expense',
            description: sub.description,
            category_id: sub.category_id,
            account_id: sub.account_id,
            payment_method: sub.payment_method || 'card',
            recurrence_day: sub.recurrence_day
          })
        }
      }
    }

    return result
  } catch (err) {
    console.error('Detect Subscriptions Error:', err)
    return []
  }
}

export async function parseSearchQuery(query: string, categories: MiniItem[]) {
  try {
    const systemPrompt = `You parse natural language search queries for a transaction history.
Extract optional filters. Return JSON:
{
  "keyword": "string or null",
  "categoryId": "matched_category_id_or_null",
  "startDate": "YYYY-MM-DD or null",
  "endDate": "YYYY-MM-DD or null",
  "type": "income" | "expense" | null
}
Categories:
${categories.map(c => `- ID: "${c.id}" | Name: "${c.name}"`).join('\n')}`

    const text = await callGroq([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Query: "${query}"\nToday is ${new Date().toISOString().split('T')[0]}` }
    ], true)

    return JSON.parse(text)
  } catch (err) {
    console.error('Search Parse Error:', err)
    return null
  }
}

export async function chatWithMonolog(messages: {role: string, content: string}[]) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Fetch context
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const [txResult, budgetsResult, currentBalance] = await Promise.all([
      supabase.from('transactions').select(`
        amount, type, description, date,
        category:categories(name, type)
      `).eq('user_id', user.id).gte('date', thirtyDaysAgo.toISOString().split('T')[0]).order('date', { ascending: false }),
      supabase.from('budgets').select(`amount, category:categories(name)`).eq('user_id', user.id),
      getBalance()
    ])

    const txs: any[] = txResult.data || []
    const budgets: any[] = budgetsResult.data || []

    // Group spending for context
    const currentMonthPrefix = new Date().toISOString().slice(0, 7)
    const categoryTotals: Record<string, number> = {}
    
    txs.forEach(t => {
      if (t.type === 'expense' && t.date.startsWith(currentMonthPrefix)) {
        const catName = t.category?.name || 'Uncategorized'
        categoryTotals[catName] = (categoryTotals[catName] || 0) + Number(t.amount)
      }
    })

    const budgetContext = budgets.map(b => {
      const catName = b.category?.name || 'Unknown'
      const spent = categoryTotals[catName] || 0
      return `${catName}: Spent ₱${spent} / Budget ₱${b.amount}`
    }).join('\n')

    const txContext = txs.map(t => `${t.date}: ${t.type} ₱${t.amount} for ${t.description || t.category?.name}`).join('\n')

    const systemPrompt = `You are MonAI, a concise, helpful, and slightly witty AI financial advisor for an app called Monolog.
Your goal is to answer the user's questions about their finances based on the provided context.
Keep your answers brief, readable, and formatting-rich (use markdown and lists when appropriate).
CRITICAL: Use emojis very sparingly. Only use 1 or 2 emojis per response at most.
Always format currency values in Philippine Peso (₱).
Avoid long robotic disclaimers. Speak like a smart friend.

IMPORTANT: Do not proactively list out the user's balance, budgets, or transactions unless they explicitly ask about them or it's highly relevant to their question. If the user just says "Hello" or makes small talk, respond conversationally and ask how you can help them with their finances today.

Context about your creator: You were developed by Michael Angelo O. Guarin (mikieee25), a Software Engineer & Frontend Developer specializing in React.js and Next.js, who interned at Sorsogon Community Innovation Labs. You can proudly mention him if asked about who made you.

<user_financial_context>
Current Balance: ₱${currentBalance}
Current Month Budgets & Pacing:
${budgetContext || 'No budgets set.'}

Recent Transactions (last 30 days):
${txContext || 'No recent transactions.'}
</user_financial_context>`

    const finalMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ]

    const text = await callGroq(finalMessages, false)
    return text
  } catch (err) {
    console.error('Chat Error:', err)
    return "I'm having trouble accessing your financial data right now. Please try again later."
  }
}
