import { useState } from "react";
import { Building2, CreditCard, Receipt, Bell, Users } from "lucide-react";
import { PaymentsSection } from "./components/PaymentsSection";
import { SubscriptionSection } from "./components/SubscriptionSection";
import { NotificationsSection } from "./components/NotificationsSection";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const sections = [
  { key: "company", label: "Perfil da empresa", icon: Building2, soon: true },
  { key: "payments", label: "Pagamentos", icon: CreditCard, soon: false },
  { key: "subscription", label: "Assinatura", icon: Receipt, soon: false },
  { key: "notifications", label: "Notificações", icon: Bell, soon: false },
  { key: "team", label: "Equipe", icon: Users, soon: true },
];

export function Settings() {
  const [active, setActive] = useState("payments");

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 text-sm">Gerencie sua conta, recebimentos e preferências do Climabra.</p>
      </div>

      {/* Nav de seções: Select no mobile, sidebar vertical no desktop */}
      <div className="grid md:grid-cols-[220px_1fr] gap-6">
        {/* Mobile: dropdown */}
        <div className="md:hidden">
          <Select value={active} onValueChange={setActive}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sections.map(({ key, label, icon: Icon, soon }) => (
                <SelectItem key={key} value={key} disabled={soon}>
                  <span className="flex items-center gap-2">
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                    {soon && <span className="text-[10px] text-gray-400">em breve</span>}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Desktop: sidebar vertical */}
        <nav className="hidden md:block md:sticky md:top-20 h-max">
          <div className="flex flex-col gap-1">
            {sections.map(({ key, label, icon: Icon, soon }) => {
              const isActive = key === active;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => !soon && setActive(key)}
                  disabled={soon}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap text-left ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : soon
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-600 hover:bg-gray-100 cursor-pointer"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{label}</span>
                  {soon && <span className="ml-auto text-[10px] text-gray-400">em breve</span>}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Content */}
        <div className="min-w-0">
          {active === "payments" && <PaymentsSection />}
          {active === "subscription" && <SubscriptionSection />}
          {active === "notifications" && <NotificationsSection />}
        </div>
      </div>
    </div>
  );
}

export default Settings;
