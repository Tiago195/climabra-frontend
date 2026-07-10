import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import type L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Info, Plus, Minus, LocateFixed } from "lucide-react";
import type { IClientResponse } from "@/services/client";
import { colorFor, labelFor, hasCoords } from "./mapColors";

interface Props {
  clients: IClientResponse[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** Altura do container do mapa (classe Tailwind). */
  heightClassName?: string;
  showLegend?: boolean;
}

/** Anima a câmera (flyTo) sempre que `selectedId` muda para um cliente com coordenadas. */
function FlyToSelected({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo(target, Math.max(map.getZoom(), 15), { duration: 0.6 });
    }
  }, [target, map]);
  return null;
}

/** Botões de zoom/recentralizar customizados (substitui o controle padrão do Leaflet). */
function MapControls({ bounds }: { bounds: [number, number][] }) {
  const map = useMap();
  return (
    <div className="absolute top-3 right-3 z-[500] flex flex-col gap-1.5">
      <button
        type="button"
        onClick={() => map.zoomIn()}
        aria-label="Aproximar"
        className="w-9 h-9 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
      >
        <Plus className="w-4 h-4 text-gray-600" />
      </button>
      <button
        type="button"
        onClick={() => map.zoomOut()}
        aria-label="Afastar"
        className="w-9 h-9 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
      >
        <Minus className="w-4 h-4 text-gray-600" />
      </button>
      {bounds.length > 0 && (
        <button
          type="button"
          onClick={() =>
            bounds.length > 1
              ? map.flyToBounds(bounds as L.LatLngBoundsExpression, { padding: [30, 30], duration: 0.6 })
              : map.flyTo(bounds[0], 14, { duration: 0.6 })
          }
          aria-label="Ver todos os clientes"
          className="w-9 h-9 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm mt-1"
        >
          <LocateFixed className="w-4 h-4 text-gray-600" />
        </button>
      )}
    </div>
  );
}

/**
 * Painel de mapa de clientes (redesign Stitch). Reutilizado no split view desktop
 * (`Client.tsx`) e na página cheia de mapa (`ClientsMap.tsx`, usada no mobile). Pinos
 * coloridos por `clientType`; o pino selecionado fica maior e abre popup com "Ver cliente".
 * `selectedId` é compartilhado com a lista: hover/clique na lista anima o mapa até o pino
 * (flyTo) e clicar num pino destaca o item na lista.
 */
export function ClientMapPanel({ clients, selectedId, onSelect, heightClassName = "h-full", showLegend = true }: Props) {
  const withCoords = useMemo(() => clients.filter(hasCoords), [clients]);

  const bounds = useMemo<[number, number][]>(
    () => withCoords.map(c => [c.lat, c.lng]),
    [withCoords]
  );

  const selectedClient = withCoords.find(c => c.id === selectedId) ?? null;
  const flyTarget: [number, number] | null = selectedClient ? [selectedClient.lat, selectedClient.lng] : null;

  // Evita recriar o MapContainer (e perder o estado de zoom/pan) a cada render.
  const initialBounds = useRef(bounds);
  const initialCenter = useRef(bounds[0]);

  if (withCoords.length === 0) {
    return (
      <Card className={heightClassName}>
        <CardContent className="h-full py-16 text-center flex flex-col items-center justify-center gap-2">
          <Info className="w-8 h-8 text-gray-300" />
          <p className="text-gray-500">Nenhum cliente com coordenadas geocodadas ainda.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden border border-gray-200 ${heightClassName}`}>
      <MapContainer
        bounds={initialBounds.current.length > 1 ? (initialBounds.current as L.LatLngBoundsExpression) : undefined}
        center={initialBounds.current.length === 1 ? initialCenter.current : undefined}
        zoom={initialBounds.current.length === 1 ? 14 : undefined}
        boundsOptions={{ padding: [30, 30] }}
        scrollWheelZoom
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FlyToSelected target={flyTarget} />
        <MapControls bounds={bounds} />
        {withCoords.map(client => {
          const isSelected = client.id === selectedId;
          return (
            <CircleMarker
              key={client.id}
              center={[client.lat, client.lng]}
              radius={isSelected ? 12 : 8}
              pathOptions={{
                color: "#fff",
                weight: isSelected ? 3 : 2,
                fillColor: colorFor(client.clientType),
                fillOpacity: 0.95,
              }}
              eventHandlers={{ click: () => onSelect(client.id) }}
            >
              <Popup>
                <div className="space-y-1 min-w-[160px]">
                  <p className="font-semibold">{client.name}</p>
                  <p className="text-xs text-gray-500">{labelFor(client.clientType)}</p>
                  <p className="text-xs text-gray-500">{client.neighborhood}, {client.city}</p>
                  <Link to={`/dashboard/clients/${client.id}`}>
                    <Button size="sm" className="w-full mt-1.5 bg-blue-600 hover:bg-blue-700 text-xs h-7">
                      Ver cliente
                    </Button>
                  </Link>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {showLegend && (
        <div className="absolute bottom-3 right-3 z-[500] bg-white/95 backdrop-blur-sm px-3 py-2.5 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1.5 border-b border-gray-100 pb-1">
            Legenda
          </p>
          <ul className="space-y-1">
            <li className="flex items-center gap-2 text-xs text-gray-600">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colorFor("commercial") }} />
              Comercial
            </li>
            <li className="flex items-center gap-2 text-xs text-gray-600">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colorFor("residential") }} />
              Residencial
            </li>
            <li className="flex items-center gap-2 text-xs text-gray-600">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colorFor(null) }} />
              Sem tipo
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
