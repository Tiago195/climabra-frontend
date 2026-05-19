/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ReactNode } from "react"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import type { IProviderResponse } from "@/services/auth"

interface AuthContextType {
  provider: IProviderResponse | null
  token: string | null
  isAuthenticated: boolean
  login: (provider: IProviderResponse, token: string) => void
  logout: () => void
  updateProvider: (patch: Partial<IProviderResponse>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useLocalStorage<IProviderResponse>("auth_provider")
  const [token, setToken] = useLocalStorage<string>("auth_token")

  const login = (newProvider: IProviderResponse, newToken: string) => {
    setProvider(newProvider)
    setToken(newToken)
  }

  const logout = () => {
    setProvider(null)
    setToken(null)
  }

  const updateProvider = (patch: Partial<IProviderResponse>) => {
    if (!provider) return
    setProvider({ ...provider, ...patch })
  }

  return (
    <AuthContext.Provider value={{
      provider,
      token,
      isAuthenticated: !!provider,
      login,
      logout,
      updateProvider,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}