import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowUpRight, CheckCircle2, Clock3, XCircle } from "lucide-react"
import type { IPayout, PayoutStatus } from "@/services/payout"
import { formatCents } from "@/lib/utils"

const STATUS: Record<PayoutStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  requested:  { label: "Solicitado",  icon: Clock3,       className: "text-amber-600" },
  processing: { label: "Processando", icon: Clock3,       className: "text-amber-600" },
  done:       { label: "Concluído",   icon: CheckCircle2, className: "text-emerald-600" },
  failed:     { label: "Falhou",      icon: XCircle,      className: "text-red-600" },
  canceled:   { label: "Cancelado",   icon: XCircle,      className: "text-gray-400" },
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" })
}

/** Histórico de saques. */
export function PayoutsList({ payouts, loading }: { payouts: IPayout[]; loading: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ArrowUpRight className="w-4 h-4 text-emerald-600" /> Saques
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : payouts.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">Nenhum saque ainda</div>
        ) : (
          <div className="divide-y">
            {payouts.map(p => {
              const status = STATUS[p.status]
              const Icon = status.icon
              return (
                <div key={p.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{formatCents(p.amountCents)}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {formatDate(p.requestedAt)} · {p.destination ?? "—"}
                    </p>
                    {/* O motivo da falha é o que responde "cadê meu dinheiro?" sem abrir suporte. */}
                    {p.status === "failed" && p.failureReason && (
                      <p className="text-xs text-red-600 mt-0.5">{p.failureReason}</p>
                    )}
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs font-medium shrink-0 ${status.className}`}>
                    <Icon className="w-4 h-4" />
                    {status.label}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
