import { createContext, useContext, useState, ReactNode } from 'react'

interface AuthUser { id: string; name: string; email: string; roles: string[] }
interface AuthContextType {
  user: AuthUser | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('access_token'))
  const [user, setUser] = useState<AuthUser | null>(() => {
    const t = localStorage.getItem('access_token')
    if (!t) return null
    try {
      const payload = JSON.parse(atob(t.split('.')[1]))
      return { id: payload.sub, name: payload.name, email: payload.email, roles: payload.roles }
    } catch { return null }
  })

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) throw new Error('Invalid email or password')
    const data = await res.json()
    localStorage.setItem('access_token', data.access_token)
    setToken(data.access_token)
    setUser(data.user)
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    setToken(null)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, token, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
