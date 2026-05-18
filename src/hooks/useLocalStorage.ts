import { useState } from "react"

export function useLocalStorage<T>(key: string, initialValue: T | null = null) {
  const [state, setState] = useState<T | null>(() => {
    const saved = localStorage.getItem(key)
    if (!saved) return initialValue
    try {
      return JSON.parse(saved) as T
    } catch {
      return initialValue
    }
  })

  const setValue = (value: T | null) => {
    setState(value)
    if (value === null) {
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, JSON.stringify(value))
    }
  }

  return [state, setValue] as const
}
