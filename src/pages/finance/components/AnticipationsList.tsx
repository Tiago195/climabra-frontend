import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Zap, CheckCircle2, Clock3, XCircle, AlertTriangle } from "lucide-react"
import type { IAnticipation, AnticipationStatus } from "@/services/anticipation"
import { formatCents } from "@/lib/utils"

/**
 * `pending` é "EM ANÁLISE", não "solicitado/quase lá". A palavra importa: o provider precisa
 * entender que ainda pode ser recusado. Por isso `pending` e `scheduled` usam âmbar (atenção), não
 * verde — verde é só quando o dinheiro entrou de fato.
 */
const STATUS: Record<
  AnticipationStatus,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  pending:   { label: "Em análise",  icon: Clock3,        className: "text-amber-600" },
  scheduled: { label: "Aprovada",    icon: Clock3,        className: "text-amber-600" },
  credited:  { label: "Antecipada",  icon: CheckCircle2,  className: "text-emerald-600" },
  denied:    { label: "Recusada",    icon: XCircle,       className: "text-red-600" },
  cancelled: { label: "Cancelada",   icon: XCircle,       className: "text-gray-400" },
  overdue:   { label: "Em atraso",   icon: AlertTriangle, className: "text-red-600" },
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
  })
}

/** Histórico de antecipações. */
export function AnticipationsList({
  anticipations, loading,
}: {
  anticipations: IAnticipation[]
  loading: boolean
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" /> Antecipações
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : anticipations.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">Nenhuma antecipação ainda</div>
        ) : (
          <div className="divide-y" data-testid="anticipations-list">
            {anticipations.map(a => {
              const status = STATUS[a.status]
              const Icon = status.icon
              return (
                <div key={a.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">
                      {formatCents(a.netCents ?? a.grossCents)}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {formatDate(a.requestedAt)}
                      {a.feeCents != null && ` · taxa ${formatCents(a.feeCents)}`}
                    </p>
                    {/*
                      Negar em silêncio é pior que negar: se o gateway recusou, o provider tem que
                      ler o motivo aqui — senão ele fica olhando para um "Recusada" sem saber o quê
                      fazer a respeito.
                    */}
                    {a.status === "denied" && a.denialReason && (
                      <p className="text-xs text-red-600 mt-0.5">{a.denialReason}</p>
                    )}
                  </div>
                  <div className={`flex items-center gap-1.5 shrink-0 ${status.className}`}>
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-medium">{status.label}</span>
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
