import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, MapPin, MapPinOff, Radio, WifiOff } from "lucide-react"
import type { LocationBeacon } from "@/hooks/useLocationBeacon"
import { isNativeApp } from "@/lib/native"

/**
 * Indicador do beacon (PLANO_ROTAS_TEMPO_REAL, task 2.3): aparece na rota do dia quando algum turno
 * está **em rota** e diz, sem rodeio, se a localização está sendo compartilhada — com desligar
 * manual sempre à mão. Mobile-first (o provider está na rua, no celular).
 *
 * Permissão negada NÃO é erro de fluxo (decisão 3): o card explica o efeito (o cliente perde o pino
 * ao vivo, não o aviso) e a rota segue normal.
 */
export function LocationBeaconCard({ beacon }: { beacon: LocationBeacon }) {
  const { status } = beacon
  if (status === "idle") return null

  // No APP o rastreio sobrevive à tela apagada (task 2.2: foreground service); o copy que fala em
  // "aba"/"navegador" seria mentira. No web a limitação continua real.
  const native = isNativeApp()
  const sharing = status === "sharing" || status === "locating" || status === "error"

  const hhmm = beacon.lastSentAt
    ? beacon.lastSentAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : null

  const meta: Record<string, { tone: string; icon: React.ReactNode; title: string; hint: string }> = {
    sharing: {
      tone: "bg-green-50 border-green-200 text-green-800",
      icon: <Radio className="w-4 h-4 text-green-600 animate-pulse" />,
      title: "Compartilhando localização",
      hint: hhmm ? `Última atualização às ${hhmm}.` : "Enviando sua posição durante a rota.",
    },
    locating: {
      tone: "bg-blue-50 border-blue-200 text-blue-800",
      icon: <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />,
      title: "Obtendo sua localização...",
      hint: "Confirme a permissão de localização se for solicitada.",
    },
    error: {
      tone: "bg-amber-50 border-amber-200 text-amber-800",
      icon: <WifiOff className="w-4 h-4 text-amber-600" />,
      title: "Sem enviar a localização agora",
      hint: hhmm
        ? `Falha de conexão — tentando de novo. Última atualização às ${hhmm}.`
        : "Falha de conexão — tentando de novo em instantes.",
    },
    denied: {
      tone: "bg-gray-50 border-gray-200 text-gray-700",
      icon: <MapPinOff className="w-4 h-4 text-gray-500" />,
      title: "Localização bloqueada",
      hint: `A rota segue normal — só não dá para mostrar sua posição ao vivo. Libere a localização nas permissões do ${native ? "app" : "navegador"} se quiser ativar.`,
    },
    unsupported: {
      tone: "bg-gray-50 border-gray-200 text-gray-700",
      icon: <MapPinOff className="w-4 h-4 text-gray-500" />,
      title: "Localização indisponível neste aparelho",
      hint: "A rota segue normal, sem posição ao vivo.",
    },
    off: {
      tone: "bg-gray-50 border-gray-200 text-gray-700",
      icon: <MapPin className="w-4 h-4 text-gray-500" />,
      title: "Compartilhamento desligado",
      hint: "Sua posição não está sendo enviada.",
    },
  }

  const current = meta[status] ?? meta.off

  return (
    <Card data-testid="location-beacon" data-status={status} className={`border ${current.tone}`}>
      <CardContent className="py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 min-w-0">
            <span className="mt-0.5 shrink-0">{current.icon}</span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold leading-tight">{current.title}</p>
              <p className="text-[11px] opacity-80 leading-snug">{current.hint}</p>
              {sharing && (
                <p className="text-[11px] opacity-70 leading-snug mt-0.5">
                  {native
                    ? "Pode bloquear a tela: a localização continua sendo enviada durante a rota (aviso “Rota em andamento” na barra de notificações)."
                    : "Mantenha esta aba aberta: com a tela bloqueada, o navegador para de enviar a posição."}
                </p>
              )}
            </div>
          </div>

          {sharing ? (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs w-full sm:w-auto shrink-0 bg-white/70"
              onClick={beacon.disable}
            >
              Desligar
            </Button>
          ) : status === "off" || status === "denied" ? (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs w-full sm:w-auto shrink-0 bg-white/70"
              onClick={beacon.enable}
            >
              {status === "denied" ? "Tentar de novo" : "Ligar"}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
