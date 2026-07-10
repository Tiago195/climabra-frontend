import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation, Home, ExternalLink, Info, Route, Clock, Loader2 } from "lucide-react"
import { ShiftBadge } from "@/components/ShiftBadge"
import type {
  IAppointmentDetailResponse,
  IAppointmentInfo,
  IAppointmentReportInfo,
} from "@/services/appointment"
import type { IClientResponse } from "@/services/client"
import { providerService, type IRoutePlanResponse } from "@/services/provider"
import {
  googleMapsRouteUrl, googleMapsSingleUrl, wazeUrl, formatFullAddress,
} from "@/lib/maps"
import { AppointmentActions } from "./AppointmentActions"
import { RouteMap } from "./RouteMap"
import { VisitTypePill } from "./VisitTypePill"

interface Props {
  token: string
  appointments: IAppointmentDetailResponse[]
  clientsById: Map<string, IClientResponse>
  creatingReportFor: string | null
  onCreateReport: (appt: IAppointmentInfo, equipmentId: string) => Promise<void> | void
  onComplete: (appt: IAppointmentInfo, reports: IAppointmentReportInfo[]) => Promise<void> | void
  onCancel: (id: string) => Promise<void> | void
}

const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

const fmtMin = (min: number) => {
  const m = Math.round(min)
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`
}

/**
 * Modo Mapa (Fase 5 — localização). Busca o plano de rota do dia em
 * `GET /providers/me/route` (ordem ótima via OSRM + ETA + geometria; fallback Haversine no
 * backend) e renderiza um mapa Leaflet/OSM com pinos numerados, a linha da rota e o ETA por
 * parada. As visitas são listadas na ordem da rota; as sem coordenadas ficam ao final (sem
 * pino/ETA). Mantém os deep-links Google Maps/Waze.
 */
export function AppointmentMapView({
  token, appointments, clientsById, creatingReportFor,
  onCreateReport, onComplete, onCancel,
}: Props) {
  const today = todayISO()

  const [plan, setPlan] = useState<IRoutePlanResponse | null>(null)
  // Começa true: o efeito de fetch roda já no mount (evita setState síncrono no efeito).
  const [loadingPlan, setLoadingPlan] = useState(true)

  useEffect(() => {
    let cancelled = false
    providerService.getRoute(token, today)
      .then(p => { if (!cancelled) setPlan(p) })
      .catch(() => { if (!cancelled) setPlan(null) })
      .finally(() => { if (!cancelled) setLoadingPlan(false) })
    return () => { cancelled = true }
  }, [token, today])

  // Ordem ótima + ETA por appointmentId (só paradas com coords entram no plano).
  const planOrder = new Map(plan?.orderedStops.map((s, i) => [s.appointmentId, i]) ?? [])
  const planMeta = new Map(plan?.orderedStops.map(s => [s.appointmentId, s]) ?? [])
  const hasPlanStops = (plan?.orderedStops.length ?? 0) > 0

  const todayItems = appointments
    .filter(row =>
      row.appointment.status === "scheduled" &&
      row.appointment.scheduledDate === today
    )
    .map(row => ({
      row,
      client: clientsById.get(row.client.id),
    }))
    .sort((a, b) => {
      // Paradas no plano vêm primeiro, na ordem da rota; o resto cai no critério por bairro.
      const oa = planOrder.has(a.row.appointment.id) ? planOrder.get(a.row.appointment.id)! : Infinity
      const ob = planOrder.has(b.row.appointment.id) ? planOrder.get(b.row.appointment.id)! : Infinity
      if (oa !== ob) return oa - ob
      return (a.client?.neighborhood ?? "").localeCompare(b.client?.neighborhood ?? "", "pt-BR") ||
        a.row.client.name.localeCompare(b.row.client.name, "pt-BR")
    })

  const uncoveredCount = todayItems.length - (plan?.orderedStops.length ?? 0)

  const stopsForUrl = todayItems
    .map(it => it.client)
    .filter((c): c is IClientResponse => !!c)

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="py-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
            <Navigation className="w-3.5 h-3.5 text-blue-600" />
            <span>
              Rota de hoje — {todayItems.length} parada{todayItems.length === 1 ? "" : "s"}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 flex items-center gap-1">
            <Home className="w-3 h-3" />
            {hasPlanStops ? (
              <span className="text-gray-500">
                {plan!.optimized ? "Ordem ótima" : "Estimativa por proximidade"}
                {" · "}~{Math.round(plan!.totalKm)} km · ~{fmtMin(plan!.totalMin)}
              </span>
            ) : (
              <span className="text-gray-500">Ordenadas por bairro</span>
            )}
          </p>
          {todayItems.length > 0 && (
            <div className="flex items-center gap-1.5 pt-1">
              <a
                href={googleMapsRouteUrl(stopsForUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button size="sm" className="w-full h-8 bg-blue-600 hover:bg-blue-700 gap-1.5 text-xs">
                  <ExternalLink className="w-3.5 h-3.5" /> Google Maps
                </Button>
              </a>
              {stopsForUrl[0] && (
                <a
                  href={wazeUrl(stopsForUrl[0])}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button size="sm" variant="outline" className="w-full h-8 gap-1.5 text-xs">
                    <ExternalLink className="w-3.5 h-3.5" /> Waze (1ª)
                  </Button>
                </a>
              )}
            </div>
          )}
          {todayItems.length > 1 && (
            <p className="text-[10px] text-gray-400 leading-tight">
              Waze não aceita múltiplas paradas — abre a 1ª; use "Ir agora" no card de cada visita.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Mapa da rota (Fase 5) — pinos numerados + linha da rota + ETA */}
      {loadingPlan ? (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-500 bg-gray-50 rounded-md">
          <Loader2 className="w-4 h-4 animate-spin" /> Calculando rota do dia...
        </div>
      ) : hasPlanStops ? (
        <div className="space-y-2">
          <RouteMap plan={plan!} />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-0.5">
            {plan!.optimized ? (
              <span className="text-[11px] text-green-700 flex items-center gap-1">
                <Route className="w-3 h-3" /> Rota real via OSRM
              </span>
            ) : (
              <span className="text-[11px] text-amber-700 flex items-center gap-1">
                <Route className="w-3 h-3" /> Estimativa (linha reta) — rota real quando o OSRM estiver ativo
              </span>
            )}
            {uncoveredCount > 0 && (
              <span className="text-[11px] text-gray-400">
                {uncoveredCount} visita{uncoveredCount > 1 ? "s" : ""} sem coordenadas fora do mapa
              </span>
            )}
          </div>
        </div>
      ) : todayItems.length > 0 ? (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-md p-3 text-[11px] text-amber-800">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <p className="leading-snug">
            As visitas de hoje ainda não têm coordenadas geográficas (geocoding por CEP), então o
            mapa e o ETA não aparecem. Use os botões Google Maps/Waze acima para abrir a rota com
            os endereços.
          </p>
        </div>
      ) : null}

      {todayItems.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-gray-500">
            Nenhuma visita para hoje
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {todayItems.map(({ row, client }, idx) => {
            const appt = row.appointment
            return (
              <Card key={appt.id}>
                <CardContent className="py-3 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className="flex items-center justify-center bg-blue-600 text-white rounded-full w-7 h-7 shrink-0 text-xs font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {row.client.name}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          <VisitTypePill visitType={appt.visitType} />
                          <ShiftBadge shift={appt.shift} size="xs" />
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">
                          {client ? formatFullAddress(client) : "Endereço indisponível"}
                        </span>
                      </p>
                      {planMeta.has(appt.id) && (
                        <p className="text-[11px] text-blue-700 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>chega em ~{fmtMin(planMeta.get(appt.id)!.cumulativeMin)} de rota</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {client && (
                    <div className="flex items-center gap-1.5">
                      <a
                        href={googleMapsSingleUrl(client)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <Button size="sm" variant="outline" className="w-full h-7 gap-1 text-[11px]">
                          <Navigation className="w-3 h-3" /> Ir agora (Maps)
                        </Button>
                      </a>
                      <a
                        href={wazeUrl(client)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <Button size="sm" variant="outline" className="w-full h-7 gap-1 text-[11px]">
                          <Navigation className="w-3 h-3" /> Waze
                        </Button>
                      </a>
                    </div>
                  )}

                  <AppointmentActions
                    row={row}
                    compact
                    creatingReportFor={creatingReportFor}
                    onCreateReport={onCreateReport}
                    onComplete={onComplete}
                    onCancel={onCancel}
                  />
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
