import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/authContext"
import { whatsappService } from "@/services/whatsapp"

/**
 * Banner global (Fase 3 do PLANO_MENSAGERIA_PROVIDER): avisa o provider quando o WhatsApp DELE caiu
 * (`status === "disconnected"`) — enquanto isso os avisos aos clientes saem pelo número da
 * plataforma (fallback). Não aparece para `none` (quem nunca conectou não é problema) nem para
 * `connecting`/`connected`. CTA leva a Configurações → WhatsApp para reconectar.
 *
 * Mora no {@code Layout} junto do {@code SubscriptionBanner} (precedente de banner global). Consulta
 * o {@code GET /whatsapp/status} uma vez ao montar e revalida em intervalo folgado (5 min) — nada de
 * poll agressivo; a fonte da verdade é o webhook {@code connection.update}. Silencioso em erro (não
 * trava a navegação se a checagem falhar).
 */
const REVALIDATE_MS = 5 * 60 * 1000

export function WhatsappDisconnectedBanner() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [disconnected, setDisconnected] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const check = useCallback(async () => {
    if (!token) return
    try {
      const s = await whatsappService.status(token)
      setDisconnected(s.status === "disconnected")
    } catch {
      /* silencioso — não trava o app se a checagem falhar */
    }
  }, [token])

  useEffect(() => {
    check()
    timerRef.current = setInterval(check, REVALIDATE_MS)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [check])

  if (!disconnected) return null

  return (
    <div
      data-testid="whatsapp-disconnected-banner"
      className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-center justify-between gap-3 flex-wrap"
    >
      <p className="text-sm text-amber-800 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        Seu WhatsApp foi desconectado. Os avisos aos clientes estão saindo pelo número da plataforma —
        reconecte para voltar a usar o seu número.
      </p>
      <Button
        size="sm"
        variant="outline"
        className="border-amber-300 text-amber-800 hover:bg-amber-100"
        onClick={() => navigate("/dashboard/settings?section=whatsapp")}
      >
        Reconectar
      </Button>
    </div>
  )
}
