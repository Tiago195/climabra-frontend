import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/authContext"

/**
 * Guard das rotas do provider (tudo sob o Layout). Sem token → volta ao login.
 *
 * Antes disto o shell autenticado renderizava VAZIO para quem abrisse /dashboard/* sem sessão
 * (cada página só fazia `if (!token) return;` num useEffect) — nada redirecionava. Guardamos pelo
 * `auth_token`, não pelo `provider`: o token é a credencial que a API exige, e o Layout já trata
 * `provider` como opcional.
 *
 * `state.from` deixa o caminho original registrado para um futuro "voltar para onde ia" pós-login;
 * `replace` evita que o VOLTAR do Android empilhe a rota protegida de novo.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
