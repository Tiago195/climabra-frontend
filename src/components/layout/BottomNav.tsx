import { useState } from "react";
import { Link } from "react-router-dom";
import { LogOut, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { bottomPrimaryItems, bottomMoreItems, providerInitials } from "@/components/layout/navItems";

type BottomNavProps = {
  activeTo?: string;
  displayName: string;
  email?: string | null;
  onLogout: () => void;
};

/**
 * Menu fixo no rodapé (< md), substituindo o antigo drawer por hambúrguer.
 * Layout inspirado em .stitch/designs/melhorias/footer.png: ícone + label
 * pequeno, item ativo destacado em azul. Como há mais destinos do que cabem
 * (7 no total), os 4 mais usados ficam fixos e o restante (Funil, Financeiro,
 * Configurações) + identidade/Sair vão para o item "Mais".
 */
export function BottomNav({ activeTo, displayName, email, onLogout }: BottomNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreIsActive = bottomMoreItems.some((item) => item.to === activeTo);

  return (
    <nav
      className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)]"
      aria-label="Navegação principal"
    >
      <div className="grid grid-cols-5 h-16">
        {bottomPrimaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.to === activeTo;
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                isActive ? "text-blue-600" : "text-gray-500",
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-label="Mais opções"
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
            moreIsActive ? "text-blue-600" : "text-gray-500",
          )}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span>Mais</span>
        </button>
      </div>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="p-0 rounded-t-2xl max-h-[80dvh] flex flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="text-base">Mais</SheetTitle>
          </SheetHeader>

          <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
            {bottomMoreItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.to === activeTo;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors",
                    isActive ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100",
                  )}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t p-3">
            <div className="flex items-center gap-2 px-3 pb-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold shrink-0">
                {providerInitials(displayName)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                {email && <p className="text-xs text-gray-500 truncate">{email}</p>}
              </div>
            </div>
            <Button variant="ghost" className="w-full justify-start gap-3 px-3 py-3 h-auto text-gray-700" onClick={onLogout}>
              <LogOut className="w-5 h-5" />
              Sair
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
