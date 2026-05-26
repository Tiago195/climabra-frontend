/**
 * Helpers para gerar URLs de navegação externa (Google Maps, Waze) a partir
 * de **endereços em texto**, dado que a API ainda não armazena lat/lng.
 *
 * Google Maps e Waze fazem geocoding no lado deles a partir da query string;
 * a UX é razoável: o app abre direto na rua/cidade certa na maioria dos casos.
 *
 * No futuro, se a API passar a expor lat/lng dos clientes, dá pra trocar essas
 * funções por versões `byCoord` mantendo a mesma assinatura interna.
 */

export interface AddressLike {
  street?: string | null
  streetNumber?: number | string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
}

/** Renderiza endereço em string single-line, pronto para query string. */
export function formatFullAddress(a: AddressLike): string {
  const streetPart =
    a.street && (a.streetNumber !== null && a.streetNumber !== undefined && a.streetNumber !== "")
      ? `${a.street}, ${a.streetNumber}`
      : a.street ?? ""
  const cityPart = a.city && a.state ? `${a.city}/${a.state}` : a.city ?? ""
  return [streetPart, a.neighborhood ?? "", cityPart]
    .filter(Boolean)
    .join(" - ")
}

/** URL do Google Maps para rota multi-stops; primeira é origem implícita do usuário, último é destino, intermediários viram waypoints. */
export function googleMapsRouteUrl(stops: AddressLike[]): string {
  if (stops.length === 0) return ""
  const addresses = stops.map(formatFullAddress)
  const destination = addresses[addresses.length - 1]
  const waypoints = addresses.slice(0, -1).join("|")
  const params = new URLSearchParams({
    api: "1",
    destination,
    travelmode: "driving",
  })
  if (waypoints) params.set("waypoints", waypoints)
  return `https://www.google.com/maps/dir/?${params.toString()}`
}

/** URL do Google Maps para rota até UMA parada. */
export function googleMapsSingleUrl(stop: AddressLike): string {
  const params = new URLSearchParams({
    api: "1",
    destination: formatFullAddress(stop),
    travelmode: "driving",
  })
  return `https://www.google.com/maps/dir/?${params.toString()}`
}

/** URL do Waze para UMA parada (Waze não aceita multi-stop). */
export function wazeUrl(stop: AddressLike): string {
  return `https://www.waze.com/ul?q=${encodeURIComponent(formatFullAddress(stop))}&navigate=yes`
}
