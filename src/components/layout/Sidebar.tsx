import { Link } from "react-router-dom";
import { ChevronsLeft, ChevronsRight, LogOut, Wind } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { navItems, providerInitials } from "@/components/layout/navItems";

type SidebarProps = {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeTo?: string;
  displayName: string;
  email?: string | null;
  onLogout: () => void;
};

/**
 * Sidebar lateral (>= md). Expandida por padrão em telas grandes (>= xl),
 * colapsada por padrão em tablets/telas médias (md–xl); o usuário pode
 * alternar a qualquer momento e a preferência é persistida (ver Layout.tsx).
 */
export function Sidebar({ collapsed, onToggleCollapse, activeTo, displayName, email, onLogout }: SidebarProps) {
  return (
    <TooltipProvider delayDuration={150}>
      <aside
        className={cn(
          "hidden md:flex md:flex-col shrink-0 sticky top-0 h-[100dvh] border-r border-gray-200 bg-white transition-[width] duration-200 ease-in-out",
          collapsed ? "md:w-[72px]" : "md:w-64",
        )}
      >
        <div className="h-16 flex items-center gap-2 px-4 border-b border-gray-100 overflow-hidden shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
            <Wind className="w-4 h-4" />
          </div>
          {!collapsed && <span className="font-bold text-lg text-blue-600 truncate">ClimaGestão</span>}
        </div>

        <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.to === activeTo;
            const link = (
              <Link
                to={item.to}
                aria-current={isActive ? "page" : undefined}
                aria-label={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md text-sm font-medium transition-colors px-3 py-2.5",
                  collapsed && "justify-center px-0",
                  isActive ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100",
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );

            if (!collapsed) {
              return <div key={item.to}>{link}</div>;
            }

            return (
              <Tooltip key={item.to}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        <div className="border-t border-gray-100 p-3 flex flex-col gap-2 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
                aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
                className={cn("text-gray-500 hover:text-gray-700", collapsed ? "w-full justify-center" : "w-full justify-start gap-2")}
              >
                {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
                {!collapsed && "Recolher"}
              </Button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Expandir menu</TooltipContent>}
          </Tooltip>

          {!collapsed ? (
            <div className="flex items-center gap-2 px-1">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold shrink-0">
                {providerInitials(displayName)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                {email && <p className="text-xs text-gray-500 truncate">{email}</p>}
              </div>
              <Button variant="ghost" size="icon" aria-label="Sair" onClick={onLogout} className="shrink-0">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Sair" onClick={onLogout} className="mx-auto">
                  <LogOut className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Sair</TooltipContent>
            </Tooltip>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
