import { useMemo } from "react"
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import type { IRoutePlanResponse } from "@/services/provider"

/**
 * Mapa da rota do dia (Fase 5). Desenha a base do provider, pinos numerados na ordem ótima,
 * a linha da rota real (geometry do OSRM) ou — no fallback — segmentos retos entre as paradas,
 * com ETA acumulado por parada no popup. Tiles OSM (grátis, atribuição obrigatória).
 */

const STOP_COLOR = "#2563eb" // blue-600
const ORIGIN_COLOR = "#16a34a" // green-600

function numberedIcon(n: number): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;justify-content:center;
      width:26px;height:26px;border-radius:9999px;background:${STOP_COLOR};color:#fff;
      font-size:12px;font-weight:700;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4)">${n}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
  })
}

const originIcon = L.divIcon({
  className: "",
  html: `<div style="display:flex;align-items:center;justify-content:center;
    width:26px;height:26px;border-radius:9999px;background:${ORIGIN_COLOR};color:#fff;
    font-size:13px;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4)">⌂</div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  popupAnchor: [0, -13],
})

function fmtMin(min: number): string {
  const m = Math.round(min)
  if (m < 60) return `${m} min`
  return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`
}

export function RouteMap({ plan }: { plan: IRoutePlanResponse }) {
  const origin = plan.origin
  const hasOrigin = origin.lat != null && origin.lng != null

  const linePositions = useMemo<[number, number][]>(() => {
    if (plan.geometry.length > 0) return plan.geometry
    // Fallback: segmentos retos base → paradas (→ base se ida-e-volta).
    const pts: [number, number][] = []
    if (hasOrigin) pts.push([origin.lat!, origin.lng!])
    for (const s of plan.orderedStops) pts.push([s.lat, s.lng])
    if (hasOrigin && plan.roundTrip) pts.push([origin.lat!, origin.lng!])
    return pts
  }, [plan, hasOrigin, origin])

  const bounds = useMemo<[number, number][]>(() => {
    const pts: [number, number][] = plan.orderedStops.map(s => [s.lat, s.lng])
    if (hasOrigin) pts.push([origin.lat!, origin.lng!])
    return pts
  }, [plan, hasOrigin, origin])

  if (bounds.length === 0) return null

  return (
    // isolation: isolate contém os z-index altos dos panes/controles do Leaflet dentro deste
    // wrapper, para não "vazarem" para o stacking context do documento e cobrirem dialogs
    // (Requests.tsx renderiza este mapa na mesma tela que NewAppointmentDialog/AppointmentActions).
    <div className="relative isolate z-0 rounded-lg overflow-hidden border border-gray-200">
      <MapContainer
        bounds={bounds.length > 1 ? (bounds as L.LatLngBoundsExpression) : undefined}
        center={bounds.length === 1 ? bounds[0] : undefined}
        zoom={bounds.length === 1 ? 14 : undefined}
        boundsOptions={{ padding: [30, 30] }}
        scrollWheelZoom={false}
        className="z-0"
        style={{ height: 280, width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {linePositions.length > 1 && (
          <Polyline
            positions={linePositions}
            pathOptions={{
              color: STOP_COLOR,
              weight: 4,
              opacity: plan.optimized ? 0.8 : 0.5,
              dashArray: plan.optimized ? undefined : "6 8",
            }}
          />
        )}

        {hasOrigin && (
          <Marker position={[origin.lat!, origin.lng!]} icon={originIcon}>
            <Popup>Base (origem da rota)</Popup>
          </Marker>
        )}

        {plan.orderedStops.map((s, idx) => (
          <Marker key={s.appointmentId} position={[s.lat, s.lng]} icon={numberedIcon(idx + 1)}>
            <Popup>
              <span className="font-semibold">{idx + 1}. {s.clientName}</span>
              <br />
              chega em ~{fmtMin(s.cumulativeMin)} de rota
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
