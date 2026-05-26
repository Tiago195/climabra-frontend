import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Pencil } from "lucide-react";
import { useAuth } from "@/contexts/authContext";
import { clientService, type IClientDetailResponse } from "@/services/client";
import { toast } from "sonner";
import { ClientInfoCard } from "./components/ClientInfoCard";
import { ClientEquipmentsCard } from "./components/ClientEquipmentsCard";
import { ClientPortalCard } from "./components/ClientPortalCard";
import { EditClientDialog } from "./components/EditClientDialog";

export function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, provider } = useAuth();

  const [data, setData] = useState<IClientDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!token || !id) return;
    clientService.findById(token, id)
      .then(setData)
      .catch(() => toast.error("Erro ao carregar cliente"))
      .finally(() => setLoading(false));
  }, [token, id]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/clients")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
        {token && (
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="w-4 h-4 mr-1" /> Editar
          </Button>
        )}
      </div>

      <ClientInfoCard client={data.client} />

      {provider?.publicToken && (
        <ClientPortalCard
          providerPublicToken={provider.publicToken}
          clientId={data.client.id.toString()}
        />
      )}

      <ClientEquipmentsCard equipments={data.equipments} />

      {token && (
        <EditClientDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          token={token}
          client={data.client}
          onUpdated={(updated) => setData(prev => (prev ? { ...prev, client: updated } : prev))}
        />
      )}
    </div>
  );
}
