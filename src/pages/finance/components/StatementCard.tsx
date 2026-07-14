import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollText, ArrowDownLeft, ArrowUpRight, Percent, RotateCcw, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/authContext"
import { financeService, type IStatementEntry } from "@/services/finance"
import { formatCents } from "@/lib/utils"

const ICONS = {
  payment: ArrowDownLeft,
  payout: ArrowUpRight,
  fee: Percent,
  refund: RotateCcw,
  other: ScrollText,
} as const

const LABELS = {
  payment: "Recebimento",
  payout: "Saque",
  fee: "Taxa",
  refund: "Estorno",
  other: "Lançamento",
} as const

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
}

/**
 * Extrato da conta de recebimento (F5).
 *
 * Existe para responder, sem suporte, a pergunta que o Financeiro sozinho não responde: "recebi
 * R$ 3.000, por que meu saldo é R$ 2.400?". Entradas, taxas e saques na mesma linha do tempo.
 */
export function StatementCard({ start, end }: { start: string; end: string }) {
  const { token } = useAuth()
  const [entries, setEntries] = useState<IStatementEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(() => {
    if (!token) return
    setLoading(true)
    setError(false)
    financeService.statement(token, start, end)
      .then(setEntries)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [token, start, end])

  useEffect(() => { load() }, [load])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-gray-500" /> Extrato da conta
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : error ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-2">
            <div className="flex items-start gap-2 flex-1">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-gray-600">Não foi possível carregar o extrato agora.</p>
            </div>
            <Button variant="outline" size="sm" onClick={load} className="w-full sm:w-auto">
              Tentar de novo
            </Button>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">Nenhum lançamento no período</div>
        ) : (
          <div className="divide-y">
            {entries.map((e, i) => {
              const Icon = ICONS[e.type]
              const isIn = e.amountCents >= 0
              return (
                <div key={`${e.date}-${i}`} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isIn ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
                    }`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {e.description || LABELS[e.type]}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(e.date)} · {LABELS[e.type]}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-semibold ${isIn ? "text-emerald-600" : "text-gray-900"}`}>
                      {isIn ? "+" : "−"}{formatCents(Math.abs(e.amountCents))}
                    </p>
                    <p className="text-xs text-gray-400">saldo {formatCents(e.balanceCents)}</p>
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
