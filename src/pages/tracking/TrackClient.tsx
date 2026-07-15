import { useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Navigation, MapPin, CheckCircle2, Clock, Loader2, WifiOff, XCircle } from "lucide-react"
import { trackingService, type ITrackingResponse } from "@/services/tracking"

/**
 * Página pública de acompanhamento "a caminho" (PLANO_ROTAS_TEMPO_REAL, Fase 3.3). Mobile-first,
 * sem auth — o gate é o token de vida curta na URL. Mostra o pino AO VIVO do prestador + o endereço
 * do cliente no mapa (Leaflet/OSM, mesmo estilo do mapa da rota) e o ETA, com polling de ~12s.
 *
 * Estados (decisão 3 — o fluxo NUNCA quebra):
 *   • a caminho (com pino)          → mapa ao vivo + "chega em ~X min"
 *   • posição indisponível (sem pino, beacon morto) → mapa só com o destino + status, sem ETA vivo
 *   • chegou / em atendimento       → estado terminal amigável
 *   • link expirado / inválido      → mensagem limpa, sem mapa
 */

const POLL_MS = 12_000

const providerIcon = L.divIcon({
  className: "",
  html: `<div style="display:flex;align-items:center;justify-content:center;
    width:34px;height:34px;border-radius:9999px;background:#2563eb;color:#fff;
    border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.45)">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
  </div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -17],
})

const clientIcon = L.divIcon({
  className: "",
  html: `<div style="display:flex;align-items:center;justify-content:center;
    width:30px;height:30px;border-radius:9999px 9999px 9999px 2px;transform:rotate(45deg);
    background:#16a34a;color:#fff;border:2px solid #fff;box-shadow:0 2px 5px rgba(0,0,0,.4)">
    <div style="transform:rotate(-45deg);font-size:14px">🏠</div>
  </div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 28],
  popupAnchor: [0, -26],
})

/** Reajusta o enquadramento do mapa quando as coordenadas mudam (o prestador se move). */
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    if (points.length === 1) {
      map.setView(points[0], 15, { animate: true })
    } else {
      map.fitBounds(points as L.LatLngBoundsExpression, { padding: [40, 40], maxZoom: 16 })
    }
  }, [map, points])
  return null
}

export function TrackClient() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<ITrackingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [expired, setExpired] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!token) return
    let alive = true

    const load = async () => {
      try {
        const d = await trackingService.get(token)
        if (!alive) return
        setData(d)
        setExpired(d.status === "expired")
        // Estados terminais não precisam mais de polling.
        if ((d.status === "expired" || d.status === "arrived") && timer.current) {
          clearInterval(timer.current)
          timer.current = null
        }
      } catch (e: unknown) {
        if (!alive) return
        // 404 = link inválido/expirado → estado limpo, sem mapa.
        const status = (e as { response?: { status?: number } })?.response?.status
        if (status === 404) {
          setExpired(true)
          if (timer.current) {
            clearInterval(timer.current)
            timer.current = null
          }
        }
        // Outros erros (rede/5xx): mantém o último estado e tenta de novo no próximo poll.
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()
    timer.current = setInterval(load, POLL_MS)
    return () => {
      alive = false
      if (timer.current) clearInterval(timer.current)
    }
  }, [token])

  const status = expired ? "expired" : data?.status
  const hasPin = !!data && data.providerLat != null && data.providerLng != null

  const mapPoints = useMemo<[number, number][]>(() => {
    if (!data) return []
    const pts: [number, number][] = []
    if (data.providerLat != null && data.providerLng != null) pts.push([data.providerLat, data.providerLng])
    if (data.clientLat != null && data.clientLng != null) pts.push([data.clientLat, data.clientLng])
    return pts
  }, [data])

  if (loading && !data) {
    return (
      <Shell status="loading">
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm">Carregando acompanhamento…</p>
        </div>
      </Shell>
    )
  }

  // ── Link expirado / inválido ──────────────────────────────────────────────
  if (status === "expired") {
    return (
      <Shell status="expired">
        <StateCard
          icon={<XCircle className="w-10 h-10 text-gray-400" />}
          title="Acompanhamento encerrado"
          desc="Este link de acompanhamento não está mais ativo. A visita já foi concluída, cancelada, ou o link expirou."
        />
      </Shell>
    )
  }

  // ── Chegou / em atendimento ───────────────────────────────────────────────
  if (status === "arrived") {
    return (
      <Shell status="arrived">
        <StateCard
          icon={<CheckCircle2 className="w-10 h-10 text-green-600" />}
          title={`${data?.providerName || "O profissional"} chegou`}
          desc="O atendimento está em andamento. Obrigado por acompanhar!"
        />
      </Shell>
    )
  }

  // ── A caminho (com ou sem pino ao vivo) ───────────────────────────────────
  return (
    <Shell status="on_my_way">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600" />
          </span>
          <h1 className="text-base font-semibold text-gray-900">
            {data?.providerName || "O profissional"} está a caminho
          </h1>
        </div>

        {hasPin ? (
          <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2.5">
            <Clock className="w-5 h-5 text-blue-600 shrink-0" />
            <p className="text-sm text-blue-900" data-testid="track-eta">
              {data?.etaMin != null
                ? <>Chega em <span className="font-bold">~{data.etaMin} min</span></>
                : "A caminho do seu endereço"}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
            <WifiOff className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-900" data-testid="track-no-position">
              Localização em tempo real temporariamente indisponível. O profissional segue a caminho.
            </p>
          </div>
        )}

        {mapPoints.length > 0 && (
          <div
            className="relative isolate z-0 rounded-xl overflow-hidden border border-gray-200"
            style={{ height: "58dvh" }}
            data-testid="track-map"
          >
            <MapContainer
              center={mapPoints[0]}
              zoom={14}
              scrollWheelZoom={false}
              className="z-0"
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitBounds points={mapPoints} />
              {hasPin && (
                <Marker position={[data!.providerLat!, data!.providerLng!]} icon={providerIcon}>
                  <Popup>{data?.providerName || "Profissional"}</Popup>
                </Marker>
              )}
              {data?.clientLat != null && data?.clientLng != null && (
                <Marker position={[data.clientLat, data.clientLng]} icon={clientIcon}>
                  <Popup>Seu endereço</Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
        )}

        <p className="text-[11px] text-center text-gray-400 flex items-center justify-center gap-1">
          <MapPin className="w-3 h-3" /> A posição atualiza sozinha a cada poucos segundos.
        </p>
      </div>
    </Shell>
  )
}

function Shell({ status, children }: { status: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-gray-50" data-testid="track-root" data-status={status}>
      <div className="max-w-md mx-auto px-4 py-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Navigation className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-700">Acompanhar visita</span>
        </div>
        {children}
      </div>
    </div>
  )
}

function StateCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-12 px-4">
      <div className="w-16 h-16 rounded-full bg-white ring-1 ring-gray-200 flex items-center justify-center">
        {icon}
      </div>
      <h1 className="text-lg font-bold text-gray-900">{title}</h1>
      <p className="text-sm text-gray-500 max-w-xs">{desc}</p>
    </div>
  )
}

export default TrackClient
