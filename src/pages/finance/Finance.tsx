import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Wallet, Clock, Receipt, CheckCircle2, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/authContext";
import {
  financeService,
  type IRevenue, type IMonthlyRevenuePoint, type ITopClient, type IPaymentsPage,
} from "@/services/finance";
import type { PaymentMethod } from "@/services/enums";
import { formatCents, deltaPercent, monthRange } from "@/lib/utils";
import { MonthlyRevenueChart } from "./components/MonthlyRevenueChart";
import { TopClientsCard } from "./components/TopClientsCard";
import { PaymentsList } from "./components/PaymentsList";
import { METHOD_LABEL } from "./labels";

type Tab = "recebidos" | "areceber";
type Period = "current" | "previous";

const PAGE_SIZE = 20;
const METHOD_CHIPS: PaymentMethod[] = ["pix", "credit", "debit", "cash", "boleto"];

interface Summary { totalCents: number; count: number }

function KpiCard({ icon, label, value, sub, tone = "blue" }: {
  icon: React.ReactNode; label: string; value: string; sub?: React.ReactNode; tone?: "blue" | "amber" | "green" | "gray";
}) {
  const tones: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    green: "bg-green-50 text-green-600",
    gray: "bg-gray-100 text-gray-500",
  };
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${tones[tone]}`}>{icon}</span>
          <p className="text-xs text-gray-500 font-medium">{label}</p>
        </div>
        <p className="text-xl font-bold text-gray-900 truncate">{value}</p>
        {sub && <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}

/** Card de erro com retry — nunca renderizamos zeros fabricados como dado real. */
function ErrorCard({ onRetry, className = "" }: { onRetry: () => void; className?: string }) {
  return (
    <Card className={className}>
      <CardContent className="py-8 flex flex-col items-center gap-3 text-center">
        <AlertCircle className="w-6 h-6 text-gray-400" />
        <p className="text-sm text-gray-500">Não foi possível carregar os dados financeiros.</p>
        <Button variant="outline" size="sm" onClick={onRetry}>Tentar novamente</Button>
      </CardContent>
    </Card>
  );
}

export function Finance() {
  const { token } = useAuth();

  const [revenue, setRevenue] = useState<IRevenue | null>(null);
  const [monthly, setMonthly] = useState<IMonthlyRevenuePoint[]>([]);
  const [topClients, setTopClients] = useState<ITopClient[]>([]);
  const [paidMonth, setPaidMonth] = useState<Summary>({ totalCents: 0, count: 0 });
  const [receivable, setReceivable] = useState<Summary>({ totalCents: 0, count: 0 });
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(false);

  const [tab, setTab] = useState<Tab>("recebidos");
  const [period, setPeriod] = useState<Period>("current");
  const [method, setMethod] = useState<PaymentMethod | undefined>(undefined);
  const [page, setPage] = useState(0);

  const [payments, setPayments] = useState<IPaymentsPage | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(false);

  // ── KPIs + chart + top clients ───────────────────────────────────────────────
  const loadSummary = useCallback(() => {
    if (!token) return;
    setSummaryLoading(true);
    setSummaryError(false);
    const cur = monthRange("current");
    Promise.all([
      financeService.revenue(token),
      financeService.monthly(token, 6),
      financeService.topClients(token, 5),
      financeService.payments(token, { status: "paid", start: cur.start, end: cur.end, size: 1 }),
      financeService.payments(token, { status: "pending", size: 1 }),
    ])
      .then(([rev, mon, top, paid, pend]) => {
        setRevenue(rev);
        setMonthly(mon);
        setTopClients(top);
        setPaidMonth({ totalCents: paid.totalCents, count: paid.totalElements });
        setReceivable({ totalCents: pend.totalCents, count: pend.totalElements });
      })
      .catch(() => {
        setSummaryError(true);
        toast.error("Não foi possível carregar o resumo financeiro");
      })
      .finally(() => setSummaryLoading(false));
  }, [token]);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  // ── Lista de pagamentos (reage a tab/período/método/página) ──────────────────
  // Tab "A receber" é o pipeline COMPLETO de pendências (mesma soma do KPI):
  // não aplica período. O filtro de mês só vale para "Recebidos".
  const loadList = useCallback(() => {
    if (!token) return;
    setListLoading(true);
    setListError(false);
    const range = tab === "recebidos" ? monthRange(period) : null;
    financeService.payments(token, {
      status: tab === "recebidos" ? "paid" : "pending",
      method,
      start: range?.start,
      end: range?.end,
      page,
      size: PAGE_SIZE,
    })
      .then(setPayments)
      .catch(() => {
        setPayments(null);
        setListError(true);
        toast.error("Não foi possível carregar os pagamentos");
      })
      .finally(() => setListLoading(false));
  }, [token, tab, period, method, page]);

  useEffect(() => { loadList(); }, [loadList]);

  // Reseta a página ao trocar filtros.
  useEffect(() => { setPage(0); }, [tab, period, method]);

  const current = revenue?.currentMonthCents ?? 0;
  const previous = revenue?.previousMonthCents ?? 0;
  const delta = deltaPercent(current, previous);
  const up = delta >= 0;
  const ticket = paidMonth.count > 0 ? Math.round(paidMonth.totalCents / paidMonth.count) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
        <p className="text-gray-500 text-sm">Visão do desempenho financeiro do seu negócio</p>
      </div>

      {/* KPIs + chart + top clientes */}
      {summaryLoading ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <Skeleton className="h-64 lg:col-span-2" />
            <Skeleton className="h-64" />
          </div>
        </>
      ) : summaryError ? (
        <ErrorCard onRetry={loadSummary} />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              icon={<Wallet className="w-4 h-4" />}
              label="Faturamento do mês"
              value={formatCents(current)}
              sub={
                <span className={`inline-flex items-center gap-0.5 font-semibold ${up ? "text-green-600" : "text-red-600"}`}>
                  {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {up ? "+" : ""}{delta}% vs mês anterior
                </span>
              }
            />
            <KpiCard
              icon={<Clock className="w-4 h-4" />}
              label="A receber"
              tone="amber"
              value={formatCents(receivable.totalCents)}
              sub={`${receivable.count} ${receivable.count === 1 ? "laudo pendente" : "laudos pendentes"}`}
            />
            <KpiCard
              icon={<Receipt className="w-4 h-4" />}
              label="Ticket médio"
              value={formatCents(ticket)}
              sub="Média no mês"
            />
            <KpiCard
              icon={<CheckCircle2 className="w-4 h-4" />}
              label="Serviços pagos"
              tone="green"
              value={String(paidMonth.count)}
              sub="No mês corrente"
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <MonthlyRevenueChart data={monthly} />
            </div>
            <div>
              <TopClientsCard clients={topClients} />
            </div>
          </div>
        </>
      )}

      {/* Lista de pagamentos */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 border-b">
            {([["recebidos", "Recebidos"], ["areceber", "A receber"]] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  tab === key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Chips de filtro (sem scroll horizontal — quebram linha no mobile).
              Período só em "Recebidos" — "A receber" é o pipeline completo. */}
          <div className="flex flex-wrap gap-2 items-center">
            {tab === "recebidos" ? (
              <>
                {([["current", "Este mês"], ["previous", "Mês passado"]] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setPeriod(key)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      period === key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
                <span className="w-px self-stretch bg-gray-200 mx-1" aria-hidden />
              </>
            ) : (
              <span className="text-[11px] text-gray-400 pr-1">Todas as pendências, sem recorte de mês</span>
            )}
            <button
              onClick={() => setMethod(undefined)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                method === undefined ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Todos
            </button>
            {METHOD_CHIPS.map(m => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  method === m ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {METHOD_LABEL[m]}
              </button>
            ))}
          </div>

          {/* Total do período filtrado */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {payments ? `${payments.totalElements} ${payments.totalElements === 1 ? "pagamento" : "pagamentos"}` : ""}
            </p>
            <p className="text-sm">
              <span className="text-gray-500">{tab === "recebidos" ? "Total do período: " : "Total a receber: "}</span>
              <span className="font-bold text-gray-900">
                {listError ? "—" : formatCents(payments?.totalCents ?? 0)}
              </span>
            </p>
          </div>

          {listError ? (
            <div className="text-center py-10 text-gray-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm mb-3">Não foi possível carregar os pagamentos.</p>
              <Button variant="outline" size="sm" onClick={loadList}>Tentar novamente</Button>
            </div>
          ) : (
            <PaymentsList items={payments?.items ?? []} loading={listLoading} />
          )}

          {/* Paginação */}
          {!listError && payments && payments.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 0}
                onClick={() => setPage(p => Math.max(0, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </Button>
              <span className="text-xs text-gray-500">
                Página {payments.page + 1} de {payments.totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= payments.totalPages - 1}
                onClick={() => setPage(p => p + 1)}
              >
                Próxima <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
