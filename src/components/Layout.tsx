import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/authContext";
import { ProfileGateProvider } from "@/components/CompleteProfileDialog";
import { SubscriptionGateProvider, SubscriptionBanner } from "@/components/SubscriptionGate";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, CalendarDays, ClipboardList, LogOut, Wind, Settings, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/dashboard/clients", label: "Clientes", icon: Users },
  { to: "/dashboard/requests", label: "Solicitações", icon: ClipboardList },
  { to: "/dashboard/availability", label: "Agenda", icon: CalendarDays },
  { to: "/dashboard/settings", label: "Configurações", icon: Settings },
];

export function Layout() {
  const { provider, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Fecha o drawer ao trocar de rota.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    navigate("/auth/login");
  };

  const activeTo = [...navItems]
    .sort((a, b) => b.to.length - a.to.length)
    .find(item => pathname === item.to || pathname.endsWith(item.to + "/"))?.to;

  return (
    <ProfileGateProvider>
    <SubscriptionGateProvider>
    <div className="min-h-[100dvh] flex flex-col bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {/* Hambúrguer (mobile) */}
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden -ml-2 size-11"
                aria-label="Abrir menu"
                onClick={() => setMenuOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <SheetContent side="left" className="w-72 p-0 flex flex-col">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle className="flex items-center gap-2 text-blue-600 text-base font-bold">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                      <Wind className="w-4 h-4" />
                    </div>
                    ClimaGestão
                  </SheetTitle>
                </SheetHeader>

                <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.to === activeTo;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors ${
                          isActive ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <Icon className="w-5 h-5 shrink-0" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>

                <div className="border-t p-3">
                  <p className="px-3 pb-2 text-xs text-gray-500 truncate">
                    {provider?.companyName ?? provider?.name ?? provider?.email}
                  </p>
                  <Button variant="ghost" className="w-full justify-start gap-3 px-3 py-3 h-auto text-gray-700" onClick={handleLogout}>
                    <LogOut className="w-5 h-5" />
                    Sair
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <div className="font-bold text-xl text-blue-600 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <Wind className="w-4 h-4" />
              </div>
              <span>ClimaGestão</span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.to === activeTo;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                    isActive ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:block">
              {provider?.companyName ?? provider?.name ?? provider?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              <span className="ml-2 hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-8">
        <SubscriptionBanner />
        <Outlet />
      </main>
    </div>
    </SubscriptionGateProvider>
    </ProfileGateProvider>
  );
}
