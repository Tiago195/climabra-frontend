import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, TrendingUp } from "lucide-react";
import type { IConversion } from "@/services/finance";

function pct(rate: number | null): string {
  return rate === null ? "—" : `${Math.round(rate * 100)}%`;
}

function Stage({ label, count, rate }: { label: string; count: number; rate?: number | null }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <div className="text-center">
        <p className="text-lg font-bold text-gray-900">{count}</p>
        <p className="text-[10px] text-gray-500 whitespace-nowrap">{label}</p>
      </div>
      {rate !== undefined && (
        <div className="flex flex-col items-center gap-0.5 px-1">
          <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
          <span className="text-[10px] font-medium text-blue-600">{pct(rate ?? null)}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Card de conversão do período (CRM F6.1): solicitações → agendado → concluído
 * → pago, com taxa entre estágios e tempo médio de ciclo. Mora na página
 * Financeiro (reage ao mesmo seletor de período — mês atual/anterior/custom)
 * em vez do topo do Funil, para ficar ao lado dos outros números financeiros
 * do período selecionado.
 */
export function ConversionCard({ data, loading }: { data: IConversion | null; loading: boolean }) {
  if (loading) {
    return <Skeleton className="h-24" />;
  }
  if (!data) {
    return null;
  }
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </span>
          <p className="text-xs text-gray-500 font-medium">Conversão do período</p>
        </div>
        <div className="flex items-center overflow-x-auto pb-1">
          <Stage label="Solicitações" count={data.submissionsCount} rate={data.submissionsToScheduledRate} />
          <Stage label="Agendado" count={data.scheduledCount} rate={data.scheduledToCompletedRate} />
          <Stage label="Concluído" count={data.completedCount} rate={data.completedToPaidRate} />
          <Stage label="Pago" count={data.paidCount} />
        </div>
        {data.avgCycleDays !== null && (
          <p className="text-[11px] text-gray-400 mt-2">
            Ciclo médio (agendamento → pagamento): <span className="font-medium text-gray-600">
              {data.avgCycleDays.toFixed(1)} dias
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
