import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet } from "lucide-react";
import { financeService, type IClientFinancials } from "@/services/finance";
import { formatCents } from "@/lib/utils";
import { formatLongDate } from "@/pages/settings/components/format";

/** Bloco "Financeiro do cliente" no ClientDetail: total faturado, ticket médio e último pagamento. */
export function ClientFinancialsCard({ token, clientId }: { token: string; clientId: string }) {
  const [data, setData] = useState<IClientFinancials | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    financeService.clientFinancials(token, clientId)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [token, clientId]);

  if (loading) return <Skeleton className="h-32" />;
  if (!data) return null;

  const stats = [
    { label: "Total faturado", value: formatCents(data.totalCents) },
    { label: "Ticket médio", value: formatCents(data.avgTicketCents) },
    { label: "Laudos pagos", value: String(data.reportCount) },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Wallet className="w-4 h-4 text-blue-500" /> Financeiro do cliente
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.reportCount === 0 ? (
          <p className="text-sm text-gray-400 py-2">Nenhum pagamento registrado ainda.</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              {stats.map(s => (
                <div key={s.label}>
                  <p className="text-[11px] text-gray-500">{s.label}</p>
                  <p className="text-base font-bold text-gray-900">{s.value}</p>
                </div>
              ))}
            </div>
            {data.lastPaymentAt && (
              <p className="text-xs text-gray-400 mt-3">
                Último pagamento em {formatLongDate(data.lastPaymentAt)}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
