import { useEffect, useState } from 'react'

export function useDebouncedCatalogSearch(value: string, delay = 250) {
  const normalizedValue = normalizeCatalogSearch(value)
  const [debouncedValue, setDebouncedValue] = useState(normalizedValue)

  useEffect(() => {
    if (normalizedValue.length === 0) {
      setDebouncedValue('')
      return
    }
    const timeout = window.setTimeout(
      () => setDebouncedValue(normalizedValue),
      delay,
    )
    return () => window.clearTimeout(timeout)
  }, [delay, normalizedValue])

  return {
    normalizedValue,
    debouncedValue,
    isDebouncing:
      normalizedValue.length > 0 && normalizedValue !== debouncedValue,
  }
}

function normalizeCatalogSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase()
}
