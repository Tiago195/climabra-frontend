import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { clientService, type IClientPortalResponse } from "@/services/client";
import { PortalHeroCard } from "./components/PortalHeroCard";
import { PortalEquipmentsCard } from "./components/PortalEquipmentsCard";
import { PortalAppointmentsCard } from "./components/PortalAppointmentsCard";
import { PortalReportsCard } from "./components/PortalReportsCard";
import { PortalSubmissionsCard } from "./components/PortalSubmissionsCard";
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

  const { client, provider, equipments, appointments, submissions, reports } = data;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <PortalHeroCard
        clientName={client.name}
        providerName={provider.companyName || provider.name}
        providerPhone={provider.phone}
      />
      <PortalEquipmentsCard
        equipments={equipments}
        appointments={appointments}
        reports={reports}
      />
      <PortalAppointmentsCard appointments={appointments} equipments={equipments} publicToken={publicToken!} clientId={id!} />
      <PortalReportsCard reports={reports} equipments={equipments} />
      <PortalSubmissionsCard submissions={submissions} equipments={equipments} />
      <PortalContactFooter phone={provider.phone} email={provider.email} />
    </div>
  );
}
