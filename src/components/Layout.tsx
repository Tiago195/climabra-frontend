import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/authContext";
import { ProfileGateProvider } from "@/components/CompleteProfileDialog";
import { SubscriptionGateProvider, SubscriptionBanner } from "@/components/SubscriptionGate";
import { useLocation, Outlet, useNavigate } from "react-router-dom";
import { ChevronsLeft, ChevronsRight, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { findActiveTo } from "@/components/layout/navItems";

/** Preferência explícita do usuário para o estado da sidebar (colapsada/expandida). */
const SIDEBAR_COLLAPSED_KEY = "climabra:sidebar-collapsed";

/**
 * Colapsada por padrão em telas médias/tablets (< xl, 1280px), expandida por
 * padrão em telas grandes (>= xl). Uma vez que o usuário alterna manualmente,
 * a escolha vira preferência persistida e passa a valer em qualquer largura.
 */
function useSidebarCollapsed() {
  const isXlUp = useMediaQuery("(min-width: 1280px)");
  const hasUserPref = useRef(
    typeof window !== "undefined" && window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) !== null,
  );

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored !== null) return stored === "1";
    return window.innerWidth < 1280;
  });

  useEffect(() => {
    if (!hasUserPref.current) {
      setCollapsed(!isXlUp);
    }
  }, [isXlUp]);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      hasUserPref.current = true;
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      return next;
    });
  };

  return { collapsed, toggle };
}

export function Layout() {
  const { provider, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { collapsed, toggle } = useSidebarCollapsed();

  const handleLogout = () => {
    logout();
    navigate("/auth/login");
  };

  const activeTo = findActiveTo(pathname);
  const displayName = provider?.companyName ?? provider?.name ?? provider?.email ?? "";

  return (
    <ProfileGateProvider>
      <SubscriptionGateProvider>
        <div className="min-h-[100dvh] flex bg-gray-50">
          <Sidebar
            collapsed={collapsed}
            onToggleCollapse={toggle}
            activeTo={activeTo}
            displayName={displayName}
            email={provider?.email}
            onLogout={handleLogout}
          />

          <div className="flex-1 min-w-0 flex flex-col">
            <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
              <div className="px-4 h-14 flex items-center justify-between gap-2">
                {/* Marca (só aparece no mobile — no desktop ela já vive no topo da sidebar) */}
                <div className="md:hidden font-bold text-lg text-blue-600 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                    <Wind className="w-4 h-4" />
                  </div>
                  <span>ClimaGestão</span>
                </div>

                {/* Toggle da sidebar (desktop) — identidade/Sair moraram pro rodapé da sidebar */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:inline-flex text-gray-500 hover:text-gray-700"
                  aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
                  onClick={toggle}
                >
                  {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
                </Button>
              </div>
            </header>

            <main className="flex-1 container mx-auto p-4 md:p-8 pb-24 md:pb-8">
              <SubscriptionBanner />
              <Outlet />
            </main>
          </div>

          <BottomNav activeTo={activeTo} displayName={displayName} email={provider?.email} onLogout={handleLogout} />
        </div>
      </SubscriptionGateProvider>
    </ProfileGateProvider>
  );
}
