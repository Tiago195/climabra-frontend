import type { ClientType, IClientResponse } from "@/services/client";

/**
 * Paleta de cores por `clientType`, compartilhada entre o painel de mapa (split view
 * desktop) e a página de mapa cheio (mobile). Alinhada ao design system do app
 * (azul primário para comercial, cinza neutro para residencial/sem tipo).
 */
export const TYPE_COLOR: Record<"residential" | "commercial" | "none", string> = {
  commercial: "#155dfc", // primary (blue-600)
  residential: "#5d5e60", // secondary/neutro
  none: "#9ca3af", // gray-400
};

export const TYPE_LABEL: Record<"residential" | "commercial" | "none", string> = {
  commercial: "Comercial",
  residential: "Residencial",
  none: "Sem tipo",
};

export function colorFor(clientType: ClientType | null | undefined): string {
  return TYPE_COLOR[clientType ?? "none"];
}

export function labelFor(clientType: ClientType | null | undefined): string {
  return TYPE_LABEL[clientType ?? "none"];
}

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function hasCoords(c: IClientResponse): c is IClientResponse & { lat: number; lng: number } {
  return c.lat != null && c.lng != null;
}
