import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

/** Pages that have URLs. Path '/' maps to defaultPage. */
export const NAV_PAGES = ['root', 'works', 'contact'] as const
export const DEFAULT_PAGE = 'root'

function pathnameToPage(pathname: string): string {
  const segment = pathname.replace(/^\/+|\/+$/g, '') || ''
  if (NAV_PAGES.includes(segment as (typeof NAV_PAGES)[number])) return segment
  return DEFAULT_PAGE
}

function pageToPath(page: string): string {
  if (page === DEFAULT_PAGE) return '/'
  return `/${page}`
}

interface NavContextValue {
  currentPage: string
  setCurrentPage: (page: string) => void
}

const NavContext = createContext<NavContextValue | null>(null)

export const NavProvider = ({ children }: { children: ReactNode }) => {
  const [currentPage, setCurrentPage] = useState<string>(() =>
    pathnameToPage(window.location.pathname)
  )

  // Sync state → URL when currentPage changes (e.g. from nav click)
  const setCurrentPageWithUrl = useCallback((page: string) => {
    setCurrentPage(page)
    const path = pageToPath(page)
    if (window.location.pathname !== path) {
      window.history.pushState({ page }, '', path)
    }
  }, [])

  // Sync URL → state on popstate (back/forward)
  useEffect(() => {
    const handlePopState = () => setCurrentPage(pathnameToPage(window.location.pathname))
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return (
    <NavContext.Provider value={{ currentPage, setCurrentPage: setCurrentPageWithUrl }}>
      {children}
    </NavContext.Provider>
  )
}

export const useNav = () => {
  const ctx = useContext(NavContext)
  if (!ctx) throw new Error('useNav must be used within NavProvider')
  return ctx
}
