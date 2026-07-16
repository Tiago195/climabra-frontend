import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Users, CalendarDays, Settings, Wallet, Filter } from "lucide-react";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

/**
 * Todos os destinos de navegação do provider, na ordem "canônica" do produto.
 * AGENDA-UNI (H1): "Solicitações" e "Agenda (config)" foram fundidas num único item "Agenda"
 * (/dashboard/agenda). A config de disponibilidade virou sub-tela (⚙ no header da Agenda).
 */
export const navItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/dashboard/clients", label: "Clientes", icon: Users },
  { to: "/dashboard/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/dashboard/funil", label: "Funil", icon: Filter },
  { to: "/dashboard/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/dashboard/settings", label: "Configurações", icon: Settings },
];

/**
 * Itens principais do bottom nav (mobile): 4 destinos de maior uso + "Mais".
 * AGENDA-UNI (H1): a fusão Solicitações+Agenda liberou 1 slot; o 4º passa a ser o **Funil**
 * (decisão default 15/07, Tiago ausente — revisar com ele). "Financeiro" e "Configurações"
 * ficam agrupados no item "Mais".
 */
const BOTTOM_PRIMARY_TO = ["/dashboard", "/dashboard/clients", "/dashboard/agenda", "/dashboard/funil"];

export const bottomPrimaryItems: NavItem[] = BOTTOM_PRIMARY_TO.map(
  (to) => navItems.find((item) => item.to === to)!,
);

export const bottomMoreItems: NavItem[] = navItems.filter((item) => !BOTTOM_PRIMARY_TO.includes(item.to));

/**
 * Resolve o `to` do item ativo, comparando pelo caminho mais específico primeiro.
 * Usa prefix-match (`pathname.startsWith(item.to + "/")`) para que sub-telas (ex.:
 * `/dashboard/agenda/disponibilidade`) mantenham o item pai ("Agenda") destacado
 * (AGENDA-UNI H2). Como os itens são ordenados do `to` mais longo pro mais curto e
 * paramos no primeiro match, "/dashboard" não "engole" as demais rotas — elas são
 * testadas (e casam) antes dele.
 */
export function findActiveTo(pathname: string, items: NavItem[] = navItems): string | undefined {
  return [...items]
    .sort((a, b) => b.to.length - a.to.length)
    .find((item) => pathname === item.to || pathname.startsWith(item.to + "/"))?.to;
}

export function providerInitials(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase();
}
