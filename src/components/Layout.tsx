import { useAuth } from "@/contexts/authContext";
import { ProfileGateProvider } from "@/components/CompleteProfileDialog";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, CalendarDays, ClipboardList, LogOut, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "dashboard/clients", label: "Clientes", icon: Users },
  { to: "/requests", label: "Solicitações", icon: ClipboardList },
  { to: "dashboard/availability", label: "Agenda", icon: CalendarDays },
];

export function Layout() {
  const { provider, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/auth/login");
  };

  return (
    <ProfileGateProvider>
    <div className="min-h-[100dvh] flex flex-col bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-bold text-xl text-blue-600 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Wind className="w-4 h-4" />
            </div>
            <span>ClimaGestão</span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.to || pathname.startsWith(item.to + "/");
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
              {provider?.companyName ?? provider?.name}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              <span className="ml-2 hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <nav className="md:hidden bg-white border-b">
        <div className="flex overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-1 px-4 py-3 text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <main className="flex-1 container mx-auto p-4 md:p-8">
        <Outlet />
      </main>
    </div>
    </ProfileGateProvider>
  );
}
