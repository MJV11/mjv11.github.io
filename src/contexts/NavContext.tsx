import { createContext, useContext, useState, type ReactNode } from 'react'

interface NavContextValue {
  currentPage: string
  setCurrentPage: (page: string) => void
}

const NavContext = createContext<NavContextValue | null>(null)

export const NavProvider = ({ children }: { children: ReactNode }) => {
  const [currentPage, setCurrentPage] = useState<string>('about')

  return (
    <NavContext.Provider value={{ currentPage, setCurrentPage }}>
      {children}
    </NavContext.Provider>
  )
}

export const useNav = () => {
  const ctx = useContext(NavContext)
  if (!ctx) throw new Error('useNav must be used within NavProvider')
  return ctx
}
