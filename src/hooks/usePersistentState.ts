import { useEffect, useState } from 'react'

function read<T>(key: string, initial: T, revive?: (raw: unknown) => T | null): T {
  try {
    const stored = window.localStorage.getItem(key)
    if (stored == null) return initial
    const parsed: unknown = JSON.parse(stored)
    const revived = revive ? revive(parsed) : (parsed as T)
    return revived ?? initial
  } catch {
    return initial
  }
}

/** useState that mirrors into localStorage and tolerates broken stored data. */
export function usePersistentState<T>(
  key: string,
  initial: T,
  revive?: (raw: unknown) => T | null,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => read(key, initial, revive))

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* storage unavailable (private mode / quota) - keep running in memory */
    }
  }, [key, value])

  return [value, setValue]
}

