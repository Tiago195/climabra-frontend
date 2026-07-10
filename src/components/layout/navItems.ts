import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Users, CalendarDays, ClipboardList, Settings, Wallet, Filter } from "lucide-react";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

/** Todos os destinos de navegação do provider, na ordem "canônica" do produto. */
export const navItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/dashboard/clients", label: "Clientes", icon: Users },
  { to: "/dashboard/requests", label: "Solicitações", icon: ClipboardList },
  { to: "/dashboard/funil", label: "Funil", icon: Filter },
  { to: "/dashboard/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/dashboard/availability", label: "Agenda", icon: CalendarDays },
  { to: "/dashboard/settings", label: "Configurações", icon: Settings },
];

/**
 * Itens principais do bottom nav (mobile), seguindo o layout de referência
 * (.stitch/designs/melhorias/footer.png): 4 destinos de maior uso + "Mais".
 * "Funil", "Financeiro" e "Configurações" ficam agrupados no item "Mais".
 */
const BOTTOM_PRIMARY_TO = ["/dashboard", "/dashboard/clients", "/dashboard/requests", "/dashboard/availability"];

export const bottomPrimaryItems: NavItem[] = BOTTOM_PRIMARY_TO.map(
  (to) => navItems.find((item) => item.to === to)!,
);

export const bottomMoreItems: NavItem[] = navItems.filter((item) => !BOTTOM_PRIMARY_TO.includes(item.to));

/** Resolve o `to` do item ativo, comparando pelo caminho mais específico primeiro. */
export function findActiveTo(pathname: string, items: NavItem[] = navItems): string | undefined {
  return [...items]
    .sort((a, b) => b.to.length - a.to.length)
    .find((item) => pathname === item.to || pathname.endsWith(item.to + "/"))?.to;
}

export function providerInitials(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase();
}
