import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/authContext";
import { clientService, type IClientResponse } from "@/services/client";
import { toast } from "sonner";
import { ClientMapPanel } from "./components/ClientMapPanel";

/**
 * Mapa de clientes em página cheia (CRM F5, redesenhado a partir do Stitch). No desktop a
 * tela de Clientes já mostra lista + mapa lado a lado (split view); esta rota fica reservada
 * para o mobile, que não comporta split — é o destino do link "Ver no mapa" da lista.
 * Reutiliza o mesmo `ClientMapPanel` do split view (pinos, cores, legenda, flyTo).
 */
export function ClientsMap() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<IClientResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    clientService.list(token)
      .then(setClients)
      .catch(() => toast.error("Erro ao carregar clientes"))
      .finally(() => setLoading(false));
  }, [token]);

  const withCoords = clients.filter(c => c.lat != null && c.lng != null).length;
  const withoutCoords = clients.length - withCoords;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/clients")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mapa de clientes</h1>
        <p className="text-gray-500 text-sm">
          {withCoords} cliente{withCoords === 1 ? "" : "s"} no mapa
        </p>
      </div>

      {loading ? (
        <Skeleton className="h-[70dvh] sm:h-[500px] w-full rounded-lg" />
      ) : (
        <ClientMapPanel
          clients={clients}
          selectedId={selectedId}
          onSelect={setSelectedId}
          heightClassName="h-[70dvh] sm:h-[500px]"
        />
      )}

      {!loading && withoutCoords > 0 && (
        <p className="text-xs text-gray-400 text-center">
          {withoutCoords} sem endereço geocodado (fora do mapa)
        </p>
      )}
    </div>
  );
}
