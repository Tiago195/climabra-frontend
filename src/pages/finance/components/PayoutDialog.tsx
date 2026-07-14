import { useState } from "react"
import { ResponsiveModal } from "@/components/ui/responsive-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ShieldCheck, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/authContext"
import { payoutService, MIN_PAYOUT_CENTS, type IPayout } from "@/services/payout"
import { getApiErrorMessage } from "@/services/apiError"
import { formatCents } from "@/lib/utils"
import { AsaasDisclosure } from "@/components/AsaasDisclosure"

/** "1.234,56" → 123456 centavos. */
function parseCents(value: string): number {
  const digits = value.replace(/\D/g, "")
  return digits ? parseInt(digits, 10) : 0
}

/**
 * Saque, em dois passos: (1) valor, (2) código no WhatsApp.
 *
 * O destino NÃO é escolhido aqui — é sempre a chave já cadastrada e confirmada (Settings). Deixar
 * o destino ser digitado na hora do saque anularia toda a proteção da conta de saque.
 */
export function PayoutDialog({
  open, availableCents, destination, onClose, onDone,
}: {
  open: boolean
  availableCents: number
  destination: string | null
  onClose: () => void
  onDone: (payout: IPayout) => void
}) {
  const { token } = useAuth()
  const [step, setStep] = useState<"amount" | "otp">("amount")
  const [amount, setAmount] = useState("")
  const [code, setCode] = useState("")
  const [phoneMasked, setPhoneMasked] = useState("")
  const [loading, setLoading] = useState(false)

  const amountCents = parseCents(amount)
  const tooSmall = amountCents > 0 && amountCents < MIN_PAYOUT_CENTS
  const tooBig = amountCents > availableCents
  const canContinue = amountCents >= MIN_PAYOUT_CENTS && !tooBig

  const reset = () => { setStep("amount"); setAmount(""); setCode(""); setPhoneMasked("") }

  const handleClose = () => {
    if (loading) return
    reset()
    onClose()
  }

  const handleRequestOtp = async () => {
    if (!token || !canContinue) return
    setLoading(true)
    try {
      const { phoneMasked } = await payoutService.requestPayoutOtp(token)
      setPhoneMasked(phoneMasked)
      setStep("otp")
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Não foi possível enviar o código"))
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!token || code.length !== 6) return
    setLoading(true)
    try {
      const payout = await payoutService.requestPayout(token, amountCents, code)
      toast.success(
        payout.status === "done"
          ? "Saque concluído! O dinheiro já está na sua conta."
          : "Saque solicitado. Avisamos quando cair na sua conta."
      )
      onDone(payout)
      reset()
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Não foi possível concluir o saque"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={o => !o && handleClose()}
      size="sm"
      title="Sacar"
      description={
        step === "amount"
          ? `Disponível: ${formatCents(availableCents)}`
          : `Enviamos um código para o WhatsApp ${phoneMasked}.`
      }
    >
      {step === "amount" ? (
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="payout-amount">Valor do saque</Label>
            <Input
              id="payout-amount"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="R$ 0,00"
              inputMode="numeric"
              className="text-lg"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {tooSmall && <span className="text-red-600">Mínimo de {formatCents(MIN_PAYOUT_CENTS)}.</span>}
                {tooBig && <span className="text-red-600">Acima do saldo disponível.</span>}
                {!tooSmall && !tooBig && amountCents > 0 && `Você vai sacar ${formatCents(amountCents)}.`}
              </p>
              <button
                type="button"
                className="text-xs font-medium text-blue-600 hover:underline"
                onClick={() => setAmount(String(availableCents))}
              >
                Sacar tudo
              </button>
            </div>
          </div>

          <div className="rounded-md bg-gray-50 border p-3 text-xs text-gray-600">
            Destino: <span className="font-mono font-medium text-gray-900">{destination ?? "—"}</span>
            <br />
            Para trocar, vá em Configurações → Pagamentos.
          </div>

          <AsaasDisclosure />

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={loading} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={handleRequestOtp} disabled={loading || !canContinue} className="w-full sm:w-auto">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Continuar
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 pt-2">
          <div className="flex items-start gap-2 rounded-md bg-blue-50 border border-blue-200 p-3">
            <ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-900">
              Confirmando <strong>{formatCents(amountCents)}</strong> para{" "}
              <span className="font-mono">{destination}</span>.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payout-code">Código de 6 dígitos</Label>
            <Input
              id="payout-code"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="tracking-[0.4em] text-center text-lg"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setStep("amount")} disabled={loading} className="w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>
            <Button onClick={handleConfirm} disabled={loading || code.length !== 6} className="w-full sm:w-auto">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirmar saque
            </Button>
          </div>
        </div>
      )}
    </ResponsiveModal>
  )
}
