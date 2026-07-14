import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Zap, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/authContext"
import { anticipationService, type IAutoAnticipation } from "@/services/anticipation"
import { getApiErrorMessage } from "@/services/apiError"
import { formatCents } from "@/lib/utils"
import { AsaasDisclosure } from "@/components/AsaasDisclosure"

/**
 * Antecipação automática (F4 do PLANO_ANTECIPACAO): toda venda no cartão é antecipada sozinha.
 *
 * TRÊS coisas que este card existe para não errar:
 *
 * 1. O LIMITE FICA VISÍVEL AO LADO DO SWITCH. Com o limite esgotado, a automática para de antecipar
 *    EM SILÊNCIO — e o provider segue vendo o switch verde, achando que funciona. Um toggle ligado
 *    que não faz nada é pior do que não ter o toggle.
 *
 * 2. A automática só pega VENDAS NOVAS. O dinheiro que já está em "a liberar" não é alcançado por
 *    ela — para esse, é a antecipação manual no Financeiro. Dizemos isso, senão o provider liga o
 *    switch e fica esperando um dinheiro que não vem.
 *
 * 3. A taxa é do GATEWAY, não da Climabra (decisão A3).
 */
export function AutoAnticipationCard() {
  const { token } = useAuth()
  const [config, setConfig] = useState<IAutoAnticipation | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!token) return
    anticipationService.autoConfig(token)
      .then(setConfig)
      .catch(() => setConfig(null))
      .finally(() => setLoading(false))
  }, [token])

  const toggle = async (enabled: boolean) => {
    if (!token) return
    setSaving(true)
    try {
      // A resposta do PUT já traz o estado REAL relido do gateway — não damos "optimistic update"
      // num switch de dinheiro.
      setConfig(await anticipationService.setAutoConfig(token, enabled))
      toast.success(
        enabled
          ? "Antecipação automática ligada."
          : "Antecipação automática desligada."
      )
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Não foi possível alterar a antecipação automática."))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Skeleton className="h-32" />

  // Conta não aprovada / sem subconta: não oferece um switch que só daria erro.
  if (!config || !config.anticipationEnabled) return null

  const noLimit = config.availableCents <= 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" /> Antecipação automática
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-gray-600">
              Antecipar automaticamente <strong>todas as novas vendas no cartão</strong>, em vez de
              esperar os 30 dias.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Disponível para antecipar:{" "}
              <span className="font-medium text-gray-700">
                {formatCents(config.availableCents)}
              </span>
            </p>
          </div>
          <Switch
            checked={config.enabled}
            disabled={saving}
            onCheckedChange={toggle}
            aria-label="Antecipação automática"
            data-testid="auto-anticipation-switch"
          />
        </div>

        {/*
          O aviso que impede o "switch que mente": ligado + limite zero = nada acontece.
        */}
        {config.enabled && noLimit && (
          <div
            className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-3"
            data-testid="auto-anticipation-no-limit"
          >
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-900">
              <p className="font-medium">Sem limite disponível no momento.</p>
              <p className="text-amber-800 mt-0.5">
                A antecipação automática está ligada, mas não vai antecipar nada até o limite ser
                liberado — ele volta conforme as antecipações anteriores são compensadas.
              </p>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500">
          Vale só para vendas <strong>novas</strong>. O que já está em “a liberar” pode ser
          antecipado uma a uma no Financeiro. A Climabra não cobra nada: a taxa é do gateway de
          pagamento, no mesmo modelo das taxas de maquininha.
        </p>

        <AsaasDisclosure />
      </CardContent>
    </Card>
  )
}
