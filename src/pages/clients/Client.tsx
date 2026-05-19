import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { Plus, Search, Users, Phone, Mail, ChevronRight, Loader2, Link2, Copy, Check } from "lucide-react";
import AddressFieldsForm, { emptyAddress, type AddressData } from "@/components/AddressFieldsForm";
import { useRequireProfile } from "@/components/CompleteProfileDialog";
import { useAuth } from "@/contexts/authContext";
import { clientService, type IClientResponse } from "@/services/client";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  link_sent: { label: "Aguardando resposta", color: "bg-yellow-100 text-yellow-800" },
  form_filled: { label: "Form enviado", color: "bg-blue-100 text-blue-800" },
  scheduled: { label: "Agendado", color: "bg-green-100 text-green-800" },
  completed: { label: "Concluído", color: "bg-gray-100 text-gray-600" },
};

export function Client() {
  const { provider, token } = useAuth();
  const requireProfile = useRequireProfile();
  const [clients, setClients] = useState<IClientResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });
  const [address, setAddress] = useState<AddressData>(emptyAddress);

  const signupUrl = provider?.publicToken
    ? `${window.location.origin}${import.meta.env.BASE_URL}r/${provider.publicToken}`
    : "";

  useEffect(() => {
    if (!token) return;
    clientService.list(token)
      .then(setClients)
      .catch(() => toast.error("Erro ao carregar clientes"))
      .finally(() => setLoading(false));
  }, [token]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(signupUrl);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;
    if (!form.email.trim()) {
      toast.error("Informe o email do cliente");
      return;
    }
    const streetNumber = parseInt(address.streetNumber);
    if (!address.streetNumber || isNaN(streetNumber)) {
      toast.error("Informe o número do endereço");
      return;
    }
    setSaving(true);
    try {
      const created = await clientService.create(token, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        cep: address.cep.replace(/\D/g, ""),
        street: address.street,
        streetNumber,
        complement: address.complement || undefined,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
      });
      setClients(prev => [created, ...prev]);
      setOpen(false);
      setForm({ name: "", phone: "", email: "", notes: "" });
      setAddress(emptyAddress);
      toast.success("Cliente cadastrado!");
    } catch {
      toast.error("Erro ao cadastrar cliente");
    } finally {
      setSaving(false);
    }
  };

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
          <Dialog open={signupOpen} onOpenChange={setSignupOpen}>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => requireProfile(() => setSignupOpen(true))}
            >
              <Link2 className="w-4 h-4" /> Link público
            </Button>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Link para novos clientes</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <p className="text-sm text-gray-600">
                  Compartilhe esse link com pessoas que ainda não são suas clientes. Elas vão preencher os dados e agendar a visita em uma única tela.
                </p>
                <div className="flex gap-2">
                  <Input value={signupUrl} readOnly className="text-xs font-mono" />
                  <Button onClick={copyLink} className="bg-blue-600 hover:bg-blue-700 gap-2 flex-shrink-0">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-400">
                  Este link é permanente. Qualquer pessoa que acessar pode se cadastrar e agendar uma visita.
                </p>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={open} onOpenChange={setOpen}>
            <Button
              className="bg-blue-600 hover:bg-blue-700 gap-2"
              onClick={() => requireProfile(() => setOpen(true))}
            >
              <Plus className="w-4 h-4" /> Novo cliente
            </Button>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Cadastrar novo cliente</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input placeholder="Nome do cliente" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Telefone *</Label>
                  <Input type="tel" placeholder="(11) 99999-9999" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" placeholder="cliente@email.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-3">Endereço</p>
                  <AddressFieldsForm value={address} onChange={setAddress} />
                </div>
                {/* TODO: voltar com esse campo caso seja necessario */}
                {/* <div className="space-y-2 pt-2 border-t">
                  <Label>Observações</Label>
                  <Input placeholder="Informações adicionais" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                </div> */}
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Cadastrar e gerar link
                </Button>
              </form>
            </DialogContent>
          </Dialog>
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
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
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
          {filtered.map(client => {
            const status = STATUS_LABELS[client as unknown as string] ?? { label: "—", color: "bg-gray-100 text-gray-600" };
            return (
              <Link key={client.id} to={`/clients/${client.id}`}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <p className="font-semibold text-gray-900">{client.name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {client.phone}
                          </span>
                          {client.email && (
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="w-3 h-3" /> {client.email}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 ml-3 shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
