import { useEffect, useState } from "react"
import { ResponsiveModal } from "@/components/ui/responsive-modal"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2, Clock3, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/authContext"
import {
  anticipationService,
  type IAnticipationSimulation,
  type IAnticipation,
} from "@/services/anticipation"
import { getApiErrorMessage } from "@/services/apiError"
import { formatCents } from "@/lib/utils"
import { AsaasDisclosure } from "@/components/AsaasDisclosure"

/**
 * Antecipar uma cobrança: simula, mostra o custo, confirma.
 *
 * DUAS REGRAS que este componente existe para respeitar:
 *
 * 1. NUNCA prometer "dinheiro agora". A antecipação passa por análise de crédito do gateway (até 2
 *    dias úteis) e PODE SER NEGADA — medido no sandbox, onde o pedido volta "pending" e o saldo não
 *    se move. Prometer o dinheiro e negar dois dias depois é a reclamação mais cara desta feature.
 *
 * 2. A taxa é do GATEWAY DE PAGAMENTO, não da Climabra (decisão A3). Dizemos isso com todas as
 *    letras e ancoramos na taxa de maquininha, que é a referência que o provider já tem na cabeça.
 *    O `netCents` que mostramos já vem líquido da comissão da Climabra (o backend desconta).
 */
export function AnticipationDialog({
  open, paymentId, paymentAmountCents, onClose, onDone,
}: {
  open: boolean
  paymentId: string | null
  paymentAmountCents: number
  onClose: () => void
  onDone: (anticipation: IAnticipation) => void
}) {
  const { token } = useAuth()
  const [simulation, setSimulation] = useState<IAnticipationSimulation | null>(null)
  const [simulating, setSimulating] = useState(false)
  const [simulationError, setSimulationError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  // Simula ao abrir: o provider precisa ver o custo ANTES de decidir, nunca depois.
  useEffect(() => {
    if (!open || !paymentId || !token) return
    setSimulating(true)
    setSimulation(null)
    setSimulationError(null)
    anticipationService.simulate(token, paymentId)
      .then(setSimulation)
      .catch(e => setSimulationError(getApiErrorMessage(e, "Não foi possível simular a antecipação.")))
      .finally(() => setSimulating(false))
  }, [open, paymentId, token])

  const handleClose = () => {
    if (confirming) return
    onClose()
  }

  const handleConfirm = async () => {
    if (!token || !paymentId) return
    setConfirming(true)
    try {
      const anticipation = await anticipationService.request(token, paymentId)
      // "Enviada", não "antecipado": o dinheiro ainda não é dele.
      toast.success("Antecipação enviada para análise.")
      onDone(anticipation)
      onClose()
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Não foi possível solicitar a antecipação."))
    } finally {
      setConfirming(false)
    }
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={o => { if (!o) handleClose() }}
      title="Antecipar recebimento"
      description={`Cobrança de ${formatCents(paymentAmountCents)} no cartão.`}
    >
      {simulating ? (
        <div className="space-y-2 pt-2">
          <Skeleton className="h-24" />
          <Skeleton className="h-10" />
        </div>
      ) : simulationError ? (
        <div className="space-y-4 pt-2">
          <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 p-3">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <p className="text-sm text-red-900">{simulationError}</p>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
              Fechar
            </Button>
          </div>
        </div>
      ) : simulation ? (
        <div className="space-y-4 pt-2">
          <div className="rounded-md border divide-y">
            <div className="flex items-center justify-between p-3">
              <span className="text-sm text-gray-600">Valor da cobrança</span>
              <span className="text-sm font-medium text-gray-900">
                {formatCents(simulation.grossCents)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3">
              <span className="text-sm text-gray-600">
                Taxa de antecipação
                <span className="block text-xs text-gray-400">
                  {simulation.anticipationDays} dias de adiantamento
                </span>
              </span>
              <span className="text-sm font-medium text-red-600">
                − {formatCents(simulation.feeCents)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50">
              <span className="text-sm font-medium text-gray-900">Você recebe</span>
              <span
                data-testid="anticipation-net"
                className="text-lg font-bold text-emerald-700"
              >
                {formatCents(simulation.netCents)}
              </span>
            </div>
          </div>

          {/*
            O aviso mais importante da tela. Sem ele, o provider entende "cliquei, recebi" — e a
            negativa dois dias depois vira reclamação.
          */}
          <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-3">
            <Clock3 className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-900">
              <p className="font-medium">O dinheiro não cai na hora.</p>
              <p className="text-amber-800 mt-0.5">
                A antecipação passa por uma análise que leva até 2 dias úteis e{" "}
                <strong>pode ser recusada</strong>. Avisamos você no WhatsApp assim que houver
                resposta.
              </p>
            </div>
          </div>

          {/* Decisão A3: a taxa é do gateway, não nossa — e a âncora que o provider entende. */}
          <p className="text-xs text-gray-500">
            A Climabra não cobra nada pela antecipação. A taxa é do gateway de pagamento, no mesmo
            modelo das taxas de maquininha de cartão.
          </p>

          <AsaasDisclosure />

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={confirming}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={confirming}
              className="w-full sm:w-auto"
              data-testid="anticipation-confirm"
            >
              {confirming && <Loader2 className="w-4 h-4 animate-spin" />}
              Antecipar {formatCents(simulation.netCents)}
            </Button>
          </div>
        </div>
      ) : null}
    </ResponsiveModal>
  )
}
