import { Building2, CreditCard, Bell, Users } from "lucide-react";
import { PaymentsSection } from "./components/PaymentsSection";

const sections = [
  { key: "company", label: "Perfil da empresa", icon: Building2, soon: false },
  { key: "payments", label: "Pagamentos", icon: CreditCard, soon: false },
  { key: "notifications", label: "Notificações", icon: Bell, soon: true },
  { key: "team", label: "Equipe", icon: Users, soon: true },
];

export function Settings() {
  const active = "payments";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 text-sm">Gerencie sua conta, recebimentos e preferências do Climabra.</p>
      </div>

      <div className="grid md:grid-cols-[220px_1fr] gap-6">
        {/* Section nav */}
        <nav className="md:sticky md:top-20 h-max">
          <div className="flex md:flex-col gap-1 overflow-x-auto pb-1">
            {sections.map(({ key, label, icon: Icon, soon }) => {
              const isActive = key === active;
              return (
                <div
                  key={key}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : soon
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-600 hover:bg-gray-100 cursor-pointer"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{label}</span>
                  {soon && <span className="ml-auto text-[10px] text-gray-400">em breve</span>}
                </div>
              );
            })}
          </div>
        </nav>

        {/* Content */}
        <div className="min-w-0">
          <PaymentsSection />
        </div>
      </div>
    </div>
  );
}

export default Settings;
