import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation, Home, ExternalLink, Info } from "lucide-react"
import { ShiftBadge } from "@/components/ShiftBadge"
import type {
  IAppointmentDetailResponse,
  IAppointmentInfo,
  IAppointmentReportInfo,
} from "@/services/appointment"
import type { IClientResponse } from "@/services/client"
import {
  googleMapsRouteUrl, googleMapsSingleUrl, wazeUrl, formatFullAddress,
} from "@/lib/maps"
import { AppointmentActions } from "./AppointmentActions"

interface Props {
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

/**
 * Modo Mapa adaptado do canvas Solicitações B - Timeline.
 *
 * O canvas original renderiza um SVG dos clientes + ETA por turno (chega/sai)
 * usando lat/lng. A API ainda não expõe coordenadas, então:
 * - Listamos as visitas do dia numeradas (1 → 2 → 3...) ordenadas por bairro
 * - Os botões abrem Google Maps/Waze com o endereço em texto livre
 * - Sem ETA por enquanto (precisa de viagem em minutos)
 */
export function AppointmentMapView({
  appointments, clientsById, creatingReportFor,
  onCreateReport, onComplete, onCancel,
}: Props) {
  const today = todayISO()

  const todayItems = appointments
    .filter(row =>
      row.appointment.status === "scheduled" &&
      row.appointment.scheduledDate === today
    )
    .map(row => ({
      row,
      client: clientsById.get(row.client.id),
    }))
    .sort((a, b) =>
      (a.client?.neighborhood ?? "").localeCompare(b.client?.neighborhood ?? "", "pt-BR") ||
      a.row.client.name.localeCompare(b.row.client.name, "pt-BR")
    )

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
            <span className="text-gray-500">Ordenadas por bairro</span>
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

      {/* Aviso: mapa visual + ETA requerem coordenadas */}
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-md p-3 text-[11px] text-amber-800">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <p className="leading-snug">
          Mapa visual e estimativa de chegada (ETA) serão habilitados quando as visitas tiverem
          coordenadas geográficas. Por enquanto, use os botões Google Maps/Waze acima para abrir
          a rota com os endereços.
        </p>
      </div>

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
                        <ShiftBadge shift={appt.shift} size="xs" />
                      </div>
                      <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">
                          {client ? formatFullAddress(client) : "Endereço indisponível"}
                        </span>
                      </p>
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
