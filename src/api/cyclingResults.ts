import type { CyclingResult, CyclingResultsPageResponse } from '../types/cycling'

const BASE_URL =
  'https://usacycling.sport80.com/pub/athletes/637764/results/datatable'

async function fetchPage(page: number): Promise<CyclingResultsPageResponse> {
  const url = new URL(BASE_URL)
  url.searchParams.set('data', '1')
  url.searchParams.set('page', String(page))

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Cycling results fetch failed: ${res.status}`)
  return res.json() as Promise<CyclingResultsPageResponse>
}

/**
 * Fetches all pages of USA Cycling results and returns a single array of results.
 */
export async function fetchAllCyclingResults(): Promise<CyclingResult[]> {
  const first = await fetchPage(0)
  const all: CyclingResult[] = [...first.data]
  const total = first.total
  const perPage = first.items_per_page
  const totalPages = Math.ceil(total / perPage)

  if (totalPages <= 1) return all

  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) => fetchPage(i + 1))
  )
  for (const page of rest) {
    all.push(...page.data)
  }

  return all
}
