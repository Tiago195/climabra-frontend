import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { useAuth } from "@/contexts/authContext";
import { financeService, type IRevenue } from "@/services/finance";
import { formatCents, deltaPercent } from "@/lib/utils";

/**
 * KPI "Faturamento do mês" no topo do Dashboard (Fase 1). R$ do mês corrente +
 * delta % vs mês anterior (seta verde/vermelha). Fonte: tabela local `payments`
 * (só `paid`). Leva à página Financeiro ao clicar.
 */
export function RevenueCard() {
  const { token } = useAuth();
  const [revenue, setRevenue] = useState<IRevenue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token) return;
    financeService.revenue(token)
      .then(setRevenue)
      .catch(() => setError(true)) // nunca renderizar R$ 0,00 fabricado como dado
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <Skeleton className="h-28" />;

  if (error || !revenue) {
    return (
      <Link to="/dashboard/financeiro" className="block">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="py-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 font-medium">Faturamento do mês</p>
              <p className="text-2xl font-bold text-gray-400 mt-0.5">—</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Não foi possível carregar</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
          </CardContent>
        </Card>
      </Link>
    );
  }

  const current = revenue.currentMonthCents;
  const previous = revenue.previousMonthCents;
  const delta = deltaPercent(current, previous);
  const up = delta >= 0;

  return (
    <Link to="/dashboard/financeiro" className="block">
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="py-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500 font-medium">Faturamento do mês</p>
              <span
                className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
                  up ? "text-green-600" : "text-red-600"
                }`}
              >
                {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {up ? "+" : ""}{delta}%
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-0.5 truncate">{formatCents(current)}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Mês anterior: {formatCents(previous)}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
        </CardContent>
      </Card>
    </Link>
  );
}
