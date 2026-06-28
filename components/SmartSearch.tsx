'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Loader2, Search, X } from 'lucide-react'
import { getCategories } from '@/app/actions'
import { parseSearchQuery } from '@/app/actions/ai'
import { keys } from '@/lib/query-keys'

interface Props {
  onFilter: (filter: any | null) => void
}

export function SmartSearch({ onFilter }: Props) {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [activeFilter, setActiveFilter] = useState(false)
  
  const { data: categories = [] } = useQuery({ queryKey: keys.categories(), queryFn: () => getCategories() })

  const handleSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (!query.trim()) {
        clear()
        return
      }

      setIsSearching(true)
      try {
        const simplifiedCategories = categories.map(c => ({ id: c.id, name: c.name }))
        const filter = await parseSearchQuery(query, simplifiedCategories)
        
        if (filter) {
          onFilter(filter)
          setActiveFilter(true)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setIsSearching(false)
      }
    }
  }

  const clear = () => {
    setQuery('')
    setActiveFilter(false)
    onFilter(null)
  }

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-stone-500">
        {isSearching ? <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> : <Search className="w-4 h-4" />}
      </div>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleSearch}
        placeholder="Search with AI (e.g. 'food last week')"
        className="pl-10 pr-10 bg-stone-900 border-stone-800 text-sm h-10 rounded-xl"
        disabled={isSearching}
      />
      {activeFilter && !isSearching && (
        <button
          onClick={clear}
          className="absolute inset-y-0 right-3 flex items-center text-stone-500 hover:text-stone-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
