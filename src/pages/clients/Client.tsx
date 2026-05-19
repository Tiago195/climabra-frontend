import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Users, Link2 } from "lucide-react";
import { useRequireProfile } from "@/components/CompleteProfileDialog";
import { useAuth } from "@/contexts/authContext";
import { clientService, type IClientResponse } from "@/services/client";
import { toast } from "sonner";
import { ClientListItem } from "./components/ClientListItem";
import { CreateClientDialog } from "./components/CreateClientDialog";
import { PublicLinkDialog } from "./components/PublicLinkDialog";

export function Client() {
  const { provider, token } = useAuth();
  const requireProfile = useRequireProfile();
  const [clients, setClients] = useState<IClientResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);

  const signupUrl = provider?.publicToken
    ? `${window.location.origin}/providers/${provider.publicToken}/client`
    : "";

  useEffect(() => {
    if (!token) return;
    clientService.list(token)
      .then(setClients)
      .catch(() => toast.error("Erro ao carregar clientes"))
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 text-sm">{clients.length} clientes cadastrados</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => requireProfile(() => setSignupOpen(true))}
          >
            <Link2 className="w-4 h-4" /> Link público
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 gap-2"
            onClick={() => requireProfile(() => setOpen(true))}
          >
            <Plus className="w-4 h-4" /> Novo cliente
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Buscar por nome, telefone ou email..."
          className="pl-10"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg font-medium">
              {search ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
            </p>
            {!search && (
              <p className="text-gray-400 text-sm mt-1 mb-4">Comece adicionando seu primeiro cliente</p>
            )}
            {!search && (
              <Button onClick={() => requireProfile(() => setOpen(true))} className="bg-blue-600 hover:bg-blue-700 gap-2">
                <Plus className="w-4 h-4" /> Adicionar cliente
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(client => (
            <ClientListItem key={client.id} client={client} />
          ))}
        </div>
      )}

      <PublicLinkDialog
        open={signupOpen}
        onOpenChange={setSignupOpen}
        signupUrl={signupUrl}
      />

      {token && (
        <CreateClientDialog
          open={open}
          onOpenChange={setOpen}
          token={token}
          onCreated={client => setClients(prev => [client, ...prev])}
        />
      )}
    </div>
  );
}
