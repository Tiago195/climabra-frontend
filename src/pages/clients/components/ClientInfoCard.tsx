import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, MapPin, Loader2 } from "lucide-react";
import { type IClientResponse } from "@/services/client";
import { useGeocode } from "@/hooks/useGeocode";

function buildAddress(c: IClientResponse): string {
  const parts: string[] = [];
  if (c.street) parts.push(`${c.street}${c.streetNumber ? `, ${c.streetNumber}` : ""}`);
  if (c.complement) parts.push(c.complement);
  if (c.neighborhood) parts.push(c.neighborhood);
  if (c.city || c.state) parts.push([c.city, c.state].filter(Boolean).join("/"));
  if (c.cep) parts.push(`CEP ${c.cep}`);
  return parts.join(" - ");
}

interface Props {
  client: IClientResponse;
}

export function ClientInfoCard({ client }: Props) {
  const address = buildAddress(client);
  const hasPersistedCoords =
    client.lat != null && client.lng != null &&
    Number.isFinite(client.lat) && Number.isFinite(client.lng);
  const { coords: geocoded, status: geoStatus } = useGeocode(
    hasPersistedCoords
      ? null
      : {
          street: client.street,
          streetNumber: client.streetNumber,
          neighborhood: client.neighborhood,
          city: client.city,
          state: client.state,
          cep: client.cep,
        },
  );
  const coords = hasPersistedCoords
    ? { lat: client.lat as number, lng: client.lng as number }
    : geocoded;
  const status = hasPersistedCoords ? "cached" : geoStatus;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{client.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Phone className="w-4 h-4 text-gray-400" />
          <span>{client.phone}</span>
        </div>
        {client.email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-gray-400" />
            <span>{client.email}</span>
          </div>
        )}
        {address && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{address}</span>
            </div>
            <div className="pl-6 text-xs text-gray-400">
              {status === "loading" && (
                <span className="inline-flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Localizando no mapa...
                </span>
              )}
              {(status === "ready" || status === "cached") && coords && (
                <span>
                  Coordenadas: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </span>
              )}
              {status === "not_found" && <span>Endereço não localizado no mapa</span>}
              {status === "error" && <span>Não foi possível localizar no mapa</span>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
