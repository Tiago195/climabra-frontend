import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { IPortalSubmission, IPortalEquipment } from "@/services/client";

function fmt(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

interface Props {
  submissions: IPortalSubmission[];
  equipments: IPortalEquipment[];
}

export function PortalSubmissionsCard({ submissions, equipments }: Props) {
  if (submissions.length === 0) return null;

  const equipmentById = new Map(equipments.map(e => [e.id, e]));
  const sorted = [...submissions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <div className="text-base font-semibold">Minhas solicitações ({submissions.length})</div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sorted.map(s => {
          const eq = s.equipmentId ? equipmentById.get(s.equipmentId) : null;
          return (
            <div key={s.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {eq ? eq.label || eq.type || "Equipamento" : "Solicitação"}
                </p>
                <span className="text-xs text-gray-400">{fmt(s.createdAt)}</span>
              </div>
              {s.description && <p className="text-xs text-gray-600">{s.description}</p>}
              {s.photoUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {s.photoUrls.map((u, i) => (
                    <a key={i} href={u} target="_blank" rel="noopener noreferrer">
                      <img src={u} alt="" className="rounded border w-full h-20 object-cover" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
