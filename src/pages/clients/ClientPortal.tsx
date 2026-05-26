import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clientService, type IClientPortalResponse } from "@/services/client";
import { PortalProviderHeader } from "./components/PortalProviderHeader";
import { PortalCalendarCard } from "./components/PortalCalendarCard";
import { PortalVisitGroups } from "./components/PortalVisitGroups";
import { PortalEquipmentsCard } from "./components/PortalEquipmentsCard";
import { PortalContactFooter } from "./components/PortalContactFooter";

export function ClientPortal() {
  const { publicToken, id } = useParams<{ publicToken: string; id: string }>();

  const [data, setData] = useState<IClientPortalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!publicToken || !id) return;
    clientService.getPortal(publicToken, id)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [publicToken, id]);

  if (loading) return (
    <div className="min-h-dvh flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  if (error || !data) return (
    <div className="min-h-dvh flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
        <h1 className="text-xl font-semibold">Código inválido</h1>
        <p className="text-gray-500 text-sm">
          O código informado não foi encontrado. Confira com seu prestador de serviço.
        </p>
      </div>
    </div>
  );

  const { client, provider, equipments, appointments, reports } = data;
  const pendingReportsCount = reports.filter(r => r.status === "sent").length;
  const providerName = provider.companyName || provider.name;
  // Caminho relativo (mantém os links de laudo público a partir do portal)
  const basePath = `/providers/${publicToken}/clients/${id}/`;

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      {/* Saudação */}
      <div className="px-1">
        <p className="text-xs uppercase tracking-wide text-gray-500">Portal do cliente</p>
        <h1 className="text-xl font-bold text-gray-900">
          Olá, {client.name.split(" ")[0]}
        </h1>
      </div>

      <PortalProviderHeader
        providerName={providerName}
        pendingReportsCount={pendingReportsCount}
      />

      <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 h-11 gap-2">
        <Link to={`${basePath}request`}>
          <Plus className="w-4 h-4" /> Solicitar nova visita
        </Link>
      </Button>

      <PortalCalendarCard appointments={appointments} />

      <PortalVisitGroups
        appointments={appointments}
        equipments={equipments}
        reports={reports}
        basePath={basePath}
      />

      <PortalEquipmentsCard
        equipments={equipments}
        reports={reports}
        publicToken={publicToken!}
        clientId={id!}
        onEquipmentAdded={eq =>
          setData(prev => prev ? { ...prev, equipments: [...prev.equipments, eq] } : prev)
        }
      />

      <PortalContactFooter phone={provider.phone} email={provider.email} />
    </div>
  );
}
