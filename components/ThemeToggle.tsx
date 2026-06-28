"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="relative inline-flex h-7 w-12 items-center rounded-full bg-zinc-800 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-inner overflow-hidden transition-colors duration-300 ease-in-out hover:ring-2 hover:ring-indigo-500/50 outline-none"
      aria-label="Toggle theme"
    >
      <div 
        className={`absolute left-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-zinc-950 shadow-sm transition-transform duration-300 ease-in-out ${
          theme === "light" ? "translate-x-5" : "translate-x-0"
        }`}
      >
        {theme === "light" ? (
          <Sun className="h-3 w-3 text-zinc-900" />
        ) : (
          <Moon className="h-3 w-3 text-zinc-100" />
        )}
      </div>
    </button>
  )
}
