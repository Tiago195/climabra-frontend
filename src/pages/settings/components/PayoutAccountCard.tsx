import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Landmark, Clock3, Zap } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/authContext"
import { payoutService, type IPayoutAccount, type PixKeyType } from "@/services/payout"
import { getApiErrorMessage } from "@/services/apiError"
import { formatCents } from "@/lib/utils"
import { PayoutAccountDialog } from "./PayoutAccountDialog"

const KEY_LABEL: Record<PixKeyType, string> = {
  cpf_cnpj: "CPF / CNPJ",
  phone: "Celular",
  email: "E-mail",
  evp: "Chave aleatória",
}

/** Ainda dentro do bloqueio de 24h da última troca? */
function isBlocked(account: IPayoutAccount): boolean {
  if (!account.payoutBlockedUntil) return false
  return new Date(account.payoutBlockedUntil) > new Date()
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
}

/** "Conta para saque" (F2): a chave PIX para onde o dinheiro do provider vai. */
export function PayoutAccountCard() {
  const { token } = useAuth()
  const [account, setAccount] = useState<IPayoutAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [savingAuto, setSavingAuto] = useState(false)

  const load = useCallback(() => {
    if (!token) return
    setLoading(true)
    payoutService.getAccount(token)
      .then(setAccount)
      .catch(() => setAccount(null))
      .finally(() => setLoading(false))
  }, [token])

  useEffect(() => { load() }, [load])

  /**
   * Liga/desliga o saque automático. É o que resolve o problema para quem NÃO lembra de sacar —
   * sem ele, o dinheiro de quem não abre o Financeiro fica parado na conta de recebimento.
   */
  const toggleAuto = async (enabled: boolean) => {
    if (!token) return
    setSavingAuto(true)
    try {
      setAccount(await payoutService.updateAutoPayout(token, enabled))
      toast.success(enabled ? "Saque automático ligado" : "Saque automático desligado")
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Não foi possível alterar o saque automático"))
    } finally {
      setSavingAuto(false)
    }
  }

  if (loading) return <Skeleton className="h-32" />

  const hasAccount = account?.hasAccount ?? false
  const blocked = account && hasAccount && isBlocked(account)

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Landmark className="w-4 h-4 text-emerald-600" /> Conta para saque
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {hasAccount && account ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500">
                    {KEY_LABEL[account.pixKeyType ?? "evp"]}
                  </p>
                  <p className="font-mono font-semibold text-gray-900">{account.maskedKey}</p>
                  {account.ownerName && (
                    <p className="text-xs text-gray-400 mt-0.5">{account.ownerName}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDialogOpen(true)}
                  className="w-full sm:w-auto"
                >
                  Trocar conta
                </Button>
              </div>

              {blocked && account.payoutBlockedUntil && (
                <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-3">
                  <Clock3 className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-900">
                    Conta trocada há pouco: por segurança, saques liberam em{" "}
                    <strong>{formatDateTime(account.payoutBlockedUntil)}</strong>.
                  </p>
                </div>
              )}

              {/* Saque automático (F6) */}
              <div className="flex items-center justify-between gap-3 border-t pt-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500" /> Saque automático
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Todo dia, o saldo disponível cai na sua chave PIX assim que passar de{" "}
                    {formatCents(account.autoPayoutMinCents)}.
                  </p>
                </div>
                <Switch
                  checked={account.autoPayoutEnabled}
                  disabled={savingAuto}
                  onCheckedChange={toggleAuto}
                  aria-label="Saque automático"
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <p className="text-sm text-gray-600 flex-1">
                Cadastre a chave PIX para onde você quer receber o dinheiro dos seus serviços.
              </p>
              <Button size="sm" onClick={() => setDialogOpen(true)} className="w-full sm:w-auto">
                Cadastrar chave
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <PayoutAccountDialog
        open={dialogOpen}
        isChange={hasAccount}
        onClose={() => setDialogOpen(false)}
        onSaved={saved => { setAccount(saved); setDialogOpen(false) }}
      />
    </>
  )
}
