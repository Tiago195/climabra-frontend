import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, ArrowRight } from "lucide-react";
import type { ITopClient } from "@/services/finance";
import { formatCents } from "@/lib/utils";

function initials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

/** "Top clientes" — ranking por faturamento pago (total, nº laudos, ticket médio). */
export function TopClientsCard({ clients }: { clients: ITopClient[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" /> Top clientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {clients.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">Nenhum faturamento ainda</div>
        ) : (
          <div className="space-y-2">
            {clients.map(c => (
              <Link
                key={c.clientId}
                to={`/dashboard/clients/${c.clientId}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-semibold shrink-0">
                  {initials(c.clientName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{c.clientName ?? "Cliente"}</p>
                  <p className="text-[11px] text-gray-500">
                    {c.reportCount} {c.reportCount === 1 ? "laudo" : "laudos"} · ticket {formatCents(c.avgTicketCents)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-sm text-gray-900">{formatCents(c.totalCents)}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
