import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import type { IMonthlyRevenuePoint } from "@/services/finance";
import { formatCents } from "@/lib/utils";

const MONTH_ABBR = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** Valor compacto no topo da barra (design Stitch): 320000 centavos → "3,2 mil". */
const COMPACT_BRL = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

/** "2026-07" → "jul". */
function monthLabel(month: string): string {
  const m = Number(month.slice(5, 7));
  return MONTH_ABBR[m - 1] ?? month;
}

/**
 * "Faturamento — últimos meses": barras mensais (mesmo padrão visual do
 * WeekVisitsChart, barras hand-rolled). O último mês (corrente) fica em destaque.
 */
export function MonthlyRevenueChart({ data }: { data: IMonthlyRevenuePoint[] }) {
  const { bars, total, max } = useMemo(() => {
    const bars = data.map((p, i) => ({
      label: monthLabel(p.month),
      value: p.totalCents,
      current: i === data.length - 1,
    }));
    return {
      bars,
      total: bars.reduce((s, b) => s + b.value, 0),
      max: Math.max(...bars.map(b => b.value), 1),
    };
  }, [data]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base">Faturamento — últimos {bars.length} meses</CardTitle>
          <p className="text-xs text-gray-500 mt-0.5">
            Total no período: <span className="font-semibold text-gray-900">{formatCents(total)}</span>
          </p>
        </div>
        <BarChart3 className="w-4 h-4 text-blue-500" />
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2 h-32">
          {bars.map((b, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 h-full group">
              <span
                className={`text-[10px] tabular-nums transition-opacity ${
                  b.current ? "text-blue-600 font-semibold" : "text-gray-400 opacity-0 group-hover:opacity-100"
                }`}
              >
                {b.value > 0 ? COMPACT_BRL.format(b.value / 100) : ""}
              </span>
              <div
                className={`w-full rounded-t ${b.current ? "bg-blue-600" : "bg-blue-200 group-hover:bg-blue-300"} transition-colors`}
                style={{ height: `${Math.max((b.value / max) * 100, 4)}%` }}
                aria-hidden
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-1.5">
          {bars.map((b, i) => (
            <span
              key={i}
              className={`flex-1 text-center text-[10px] uppercase tracking-wide ${
                b.current ? "text-blue-600 font-semibold" : "text-gray-400"
              }`}
            >
              {b.label}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
