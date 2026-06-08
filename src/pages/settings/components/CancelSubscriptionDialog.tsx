import { useState } from "react"
import { ResponsiveModal } from "@/components/ui/responsive-modal"
import { Button } from "@/components/ui/button"
import { Loader2, Check } from "lucide-react"
import { formatShortDate } from "./format"

interface Props {
  open: boolean
  nextDueDate: string | null
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function CancelSubscriptionDialog({ open, nextDueDate, onClose, onConfirm }: Props) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
    }
  }

  const bullets = [
    nextDueDate
      ? `Você mantém acesso ao app até ${formatShortDate(nextDueDate)}.`
      : "Você mantém acesso até o fim do período já pago.",
    "Seus clientes, laudos e histórico continuam salvos.",
    "Pode reativar quando quiser, sem perder nada.",
    "Nenhuma cobrança nova depois do cancelamento.",
  ]

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={o => !o && !loading && onClose()}
      size="sm"
      title="Cancelar assinatura?"
    >
        <p className="text-sm text-gray-500 -mt-1">
          Você não perde nada agora — o cancelamento só vale a partir do fim do período já pago.
        </p>
        <ul className="space-y-2 py-2">
          {bullets.map(b => (
            <li key={b} className="flex items-start gap-2 text-sm text-gray-700">
              <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Manter assinatura
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Sim, cancelar
          </Button>
        </div>
    </ResponsiveModal>
  )
}
