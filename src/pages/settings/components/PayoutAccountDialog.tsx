import { useState } from "react"
import { ResponsiveModal } from "@/components/ui/responsive-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Loader2, ShieldCheck, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/authContext"
import { payoutService, type IPayoutAccount, type PixKeyType } from "@/services/payout"
import { getApiErrorMessage } from "@/services/apiError"
import { AsaasDisclosure } from "@/components/AsaasDisclosure"

const KEY_TYPES: { value: PixKeyType; label: string; hint: string; placeholder: string }[] = [
  { value: "cpf_cnpj", label: "CPF / CNPJ", hint: "Precisa ser o mesmo da sua conta de recebimento.", placeholder: "000.000.000-00" },
  { value: "phone",    label: "Celular",    hint: "Precisa ser o WhatsApp confirmado na sua conta.",   placeholder: "(00) 00000-0000" },
  { value: "email",    label: "E-mail",     hint: "Precisa ser o e-mail da sua conta Climabra.",       placeholder: "voce@email.com" },
  { value: "evp",      label: "Chave aleatória", hint: "A chave gerada pelo seu banco (formato de código).", placeholder: "00000000-0000-0000-0000-000000000000" },
]

/**
 * Cadastro/troca do destino do saque, em dois passos: (1) chave PIX, (2) código no WhatsApp.
 *
 * O OTP não é burocracia: trocar essa chave redireciona TODO o faturamento do provider. Sem prova
 * de posse do número, uma sessão roubada bastaria para desviar o dinheiro.
 */
export function PayoutAccountDialog({
  open, onClose, onSaved, isChange,
}: {
  open: boolean
  onClose: () => void
  onSaved: (account: IPayoutAccount) => void
  isChange: boolean
}) {
  const { token } = useAuth()
  const [step, setStep] = useState<"key" | "otp">("key")
  const [keyType, setKeyType] = useState<PixKeyType>("cpf_cnpj")
  const [pixKey, setPixKey] = useState("")
  const [code, setCode] = useState("")
  const [phoneMasked, setPhoneMasked] = useState("")
  const [loading, setLoading] = useState(false)

  const selected = KEY_TYPES.find(k => k.value === keyType)!

  const reset = () => {
    setStep("key"); setKeyType("cpf_cnpj"); setPixKey(""); setCode(""); setPhoneMasked("")
  }

  const handleClose = () => {
    if (loading) return
    reset()
    onClose()
  }

  /** Passo 1 → dispara o código. A chave só é validada no backend, junto com o OTP. */
  const handleRequestOtp = async () => {
    if (!token || !pixKey.trim()) return
    setLoading(true)
    try {
      const { phoneMasked } = await payoutService.requestOtp(token)
      setPhoneMasked(phoneMasked)
      setStep("otp")
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Não foi possível enviar o código"))
    } finally {
      setLoading(false)
    }
  }

  /** Passo 2 → grava (backend valida OTP + posse da chave). */
  const handleSave = async () => {
    if (!token || code.length !== 6) return
    setLoading(true)
    try {
      const account = await payoutService.saveAccount(token, { pixKeyType: keyType, pixKey, code })
      toast.success("Conta de saque atualizada")
      onSaved(account)
      reset()
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Não foi possível salvar a conta de saque"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={o => !o && handleClose()}
      size="sm"
      title={isChange ? "Trocar conta de saque" : "Cadastrar conta de saque"}
      description={
        step === "key"
          ? "O dinheiro dos seus serviços vai cair nessa chave PIX. Ela precisa ser sua."
          : `Enviamos um código para o WhatsApp ${phoneMasked}.`
      }
    >
      {step === "key" ? (
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="payout-key-type">Tipo de chave</Label>
            <Select value={keyType} onValueChange={v => { setKeyType(v as PixKeyType); setPixKey("") }}>
              <SelectTrigger id="payout-key-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KEY_TYPES.map(k => (
                  <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payout-key">Chave PIX</Label>
            <Input
              id="payout-key"
              value={pixKey}
              onChange={e => setPixKey(e.target.value)}
              placeholder={selected.placeholder}
              autoComplete="off"
            />
            <p className="text-xs text-gray-500">{selected.hint}</p>
          </div>

          {isChange && (
            <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
              Por segurança, saques ficam <strong>bloqueados por 24h</strong> depois de trocar a
              conta — e avisamos a troca no seu WhatsApp.
            </div>
          )}

          <AsaasDisclosure />

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
            <Button variant="outline" onClick={handleClose} disabled={loading} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={handleRequestOtp} disabled={loading || !pixKey.trim()} className="w-full sm:w-auto">
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
              Confirmar pelo WhatsApp garante que só você muda para onde o seu dinheiro vai.
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
            <Button variant="outline" onClick={() => setStep("key")} disabled={loading} className="w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>
            <Button onClick={handleSave} disabled={loading || code.length !== 6} className="w-full sm:w-auto">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirmar
            </Button>
          </div>
        </div>
      )}
    </ResponsiveModal>
  )
}
