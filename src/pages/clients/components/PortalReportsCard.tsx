import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import type { IPortalReport, IPortalEquipment } from "@/services/client";

const STATUS: Record<string, { label: string; color: string }> = {
  draft: { label: "Rascunho", color: "bg-gray-100 text-gray-600" },
  sent: { label: "Aguardando aprovação", color: "bg-yellow-100 text-yellow-800" },
  approved: { label: "Aprovado", color: "bg-blue-100 text-blue-700" },
  completed: { label: "Finalizado", color: "bg-green-100 text-green-700" },
};

const VISIBLE = new Set(["sent", "approved", "completed"]);

function fmt(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

interface Props {
  reports: IPortalReport[];
  equipments: IPortalEquipment[];
}

export function PortalReportsCard({ reports, equipments }: Props) {
  const equipmentById = new Map(equipments.map(e => [e.id, e]));
  const sorted = [...reports].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-4 h-4" /> Laudos ({reports.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sorted.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-3">Nenhum laudo emitido ainda.</p>
        ) : (
          sorted.map(r => {
            const eq = equipmentById.get(r.equipmentId);
            const st = STATUS[r.status] ?? { label: r.status, color: "bg-gray-100 text-gray-600" };

            return (
              <div key={r.id} className="border rounded-lg p-3 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{r.title || "Laudo"}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {eq ? eq.label || eq.type || "Equipamento" : "—"} · {fmt(r.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={`text-xs ${st.color}`}>{st.label}</Badge>
                  {VISIBLE.has(r.status) && (
                    <Link to={`equipment/${r.equipmentId}/laudo/${r.publicToken}`} className="text-blue-600 hover:text-blue-700">
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
