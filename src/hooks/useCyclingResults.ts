import { useQuery } from '@tanstack/react-query'
import { fetchAllCyclingResults } from '../api/cyclingResults'

export const cyclingResultsQueryKey = ['cycling-results'] as const

export function useCyclingResults() {
  return useQuery({
    queryKey: cyclingResultsQueryKey,
    queryFn: fetchAllCyclingResults,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
