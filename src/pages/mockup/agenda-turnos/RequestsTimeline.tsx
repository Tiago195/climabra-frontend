import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MapPin, Navigation } from "lucide-react";
import {
  APPOINTMENTS,
  PROVIDER,
  TODAY,
  MockupShell,
  ShiftBadge,
  clientById,
  distanceKm,
  MONTH_NAMES_SHORT,
  DAY_NAMES_SHORT,
} from "./_shared";
import { EquipmentReportActions } from "./_actions";

type Bucket = "today" | "week" | "later";

function bucketFor(dateISO: string): Bucket {
  if (dateISO === TODAY) return "today";
  const today = new Date(`${TODAY}T00:00:00`);
  const d = new Date(`${dateISO}T00:00:00`);
  const diff = (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 7 && diff > 0) return "week";
  return "later";
}

const BUCKET_LABELS: Record<Bucket, string> = {
  today: "Hoje",
  week: "Esta semana",
  later: "Depois",
};

const BUCKET_BARS: Record<Bucket, string> = {
  today: "bg-blue-600",
  week: "bg-blue-400",
  later: "bg-gray-300",
};

export default function RequestsTimeline() {
  // todas as visitas agendadas a partir de hoje, enriquecidas com distância da base
  const enriched = APPOINTMENTS
    .filter(a => a.status === "scheduled" && a.scheduledDate >= TODAY)
    .map(a => {
      const cli = clientById(a.clientId);
      return { ...a, client: cli, distance: distanceKm(PROVIDER, cli), bucket: bucketFor(a.scheduledDate) };
    });

  // agrupar por bucket, dentro do bucket ordenar por proximidade
  const groups: { bucket: Bucket; items: typeof enriched }[] = (["today","week","later"] as Bucket[]).map(b => ({
    bucket: b,
    items: enriched.filter(e => e.bucket === b).sort((a, b) => a.distance - b.distance),
  }));

  const totalKm = enriched.reduce((s, e) => s + e.distance, 0);

  return (
    <MockupShell title="Solicitações" subtitle="Variante B — Timeline por proximidade">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{enriched.length} visitas agendadas</p>
        <Button className="bg-blue-600 hover:bg-blue-700 gap-1.5 h-8" size="sm">
          <Plus className="w-3.5 h-3.5" /> Nova
        </Button>
      </div>

      <Card>
        <CardContent className="py-3 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
            <Navigation className="w-3.5 h-3.5 text-blue-600" />
            <span>Ordenadas por proximidade dentro de cada período</span>
          </div>
          <p className="text-[11px] text-gray-500 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Saindo de <span className="font-medium text-gray-700">{PROVIDER.baseAddress.split("—")[0].trim()}</span>
            <span className="ml-auto font-semibold text-blue-700">Σ {totalKm.toFixed(1)} km</span>
          </p>
        </CardContent>
      </Card>

      {groups.map(g => {
        if (g.items.length === 0) return null;
        return (
          <div key={g.bucket} className="space-y-2">
            {/* Separador */}
            <div className="flex items-center gap-2 pt-1">
              <div className={`h-1.5 w-1.5 rounded-full ${BUCKET_BARS[g.bucket]}`} />
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                {BUCKET_LABELS[g.bucket]}
              </p>
              <span className="text-[10px] text-gray-400">· {g.items.length} visita{g.items.length > 1 ? "s" : ""}</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {g.items.map((a, i) => {
              const d = new Date(`${a.scheduledDate}T00:00:00`);
              return (
                <Card key={a.id}>
                  <CardContent className="py-3 space-y-2">
                    <div className="flex items-start gap-2.5">
                      <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg w-11 py-1 shrink-0">
                        <span className="text-[9px] uppercase font-bold text-gray-400">{DAY_NAMES_SHORT[d.getDay()]}</span>
                        <span className="text-base font-bold text-gray-900 leading-none">{d.getDate()}</span>
                        <span className="text-[9px] text-gray-400">{MONTH_NAMES_SHORT[d.getMonth()]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-900 truncate">{a.client.name}</p>
                          <ShiftBadge shift={a.shift} size="xs" />
                        </div>
                        <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {a.client.neighborhood}
                          <span className="ml-auto inline-flex items-center gap-0.5 font-semibold text-blue-700">
                            <Navigation className="w-2.5 h-2.5" />
                            {a.distance.toFixed(1)} km
                          </span>
                        </p>
                      </div>
                    </div>

                    <EquipmentReportActions appt={a} compact />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        );
      })}

      {enriched.length === 0 && (
        <Card><CardContent className="py-10 text-center text-sm text-gray-500">Nenhuma visita futura</CardContent></Card>
      )}
    </MockupShell>
  );
}
