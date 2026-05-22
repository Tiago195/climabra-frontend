import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/authContext";
import { reportService, type IReportResponse } from "@/services/report";
import { appointmentService, type IAppointmentDetailResponse } from "@/services/appointment";
import { type IEquipmentResponse } from "@/services/client";
import { type ReportStatus } from "@/services/enums";
import { toast } from "sonner";
import { FileText, Plus, Trash2, Loader2, CalendarClock } from "lucide-react";

const STATUS_LABEL: Record<ReportStatus, { label: string; color: string }> = {
  draft:     { label: "Rascunho", color: "bg-gray-200 text-gray-700" },
  sent:      { label: "Aguardando cliente", color: "bg-yellow-100 text-yellow-800" },
  approved:  { label: "Aprovado", color: "bg-blue-100 text-blue-800" },
  completed: { label: "Concluído", color: "bg-green-100 text-green-800" },
};

export default function EquipmentReports({ equipment }: { equipment: IEquipmentResponse }) {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [reports, setReports] = useState<IReportResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [diagnosis, setDiagnosis] = useState("");
  const [items, setItems] = useState<string[]>([""]);
  const [appointmentId, setAppointmentId] = useState<string>("none");
  const [linkable, setLinkable] = useState<IAppointmentDetailResponse[]>([]);

  useEffect(() => {
    if (!token) return;
    reportService.listByEquipment(token, equipment.id)
      .then(setReports)
      .catch(() => toast.error("Erro ao carregar laudos"))
      .finally(() => setLoading(false));
  }, [token, equipment.id]);

  useEffect(() => {
    if (!open || !token) return;
    appointmentService.list(token)
      .then(rows => {
        const filtered = rows
          .filter(row => {
            const a = row.appointment;
            if (a.status !== "scheduled") return false;
            if (row.client.id !== equipment.clientId) return false;
            if (row.report) return false;
            return a.equipmentId == null || a.equipmentId === equipment.id;
          })
          .sort((a, b) => new Date(a.appointment.scheduledAt).getTime() - new Date(b.appointment.scheduledAt).getTime());
        setLinkable(filtered);
      })
      .catch(() => { /* silencioso — vínculo é opcional */ });
  }, [open, token, equipment.id, equipment.clientId]);

  const resetForm = () => {
    setDiagnosis("");
    setItems([""]);
    setAppointmentId("none");
  };

  const handleCreate = async () => {
    const validItems = items.map(d => d.trim()).filter(Boolean);
    if (validItems.length === 0) {
      toast.error("Adicione pelo menos um item");
      return;
    }
    if (!token) return;

    const stillValid = appointmentId !== "none" && linkable.some(row => row.appointment.id === appointmentId);

    setSaving(true);
    try {
      const created = await reportService.create(token, {
        equipmentId: equipment.id,
        appointmentId: stillValid ? appointmentId : undefined,
        diagnosis: diagnosis.trim() || undefined,
        items: validItems.map(description => ({ description })),
      });
      setReports(prev => [created, ...prev]);
      setOpen(false);
      resetForm();
      navigate(`/dashboard/reports/${created.id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao criar laudo";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
          <FileText className="w-4 h-4" /> Histórico de laudos
        </h4>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <Plus className="w-3 h-3 mr-1" /> Novo laudo
        </Button>
      </div>

      {loading ? (
        <p className="text-xs text-gray-400">Carregando...</p>
      ) : reports.length === 0 ? (
        <p className="text-xs text-gray-400 italic">Nenhum laudo ainda.</p>
      ) : (
        <div className="space-y-1">
          {reports.map(r => {
            const s = STATUS_LABEL[r.status] ?? { label: r.status, color: "bg-gray-100 text-gray-600" };
            return (
              <button
                key={r.id}
                onClick={() => navigate(`/dashboard/reports/${r.id}`)}
                className="w-full text-left px-3 py-2 rounded border hover:bg-gray-50 flex items-center justify-between gap-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Laudo #{r.id.slice(0, 8)}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(r.createdAt).toLocaleDateString("pt-BR")}
                    {r.completedAt && ` · finalizado em ${new Date(r.completedAt).toLocaleDateString("pt-BR")}`}
                  </p>
                </div>
                <Badge className={`${s.color} text-xs`}>{s.label}</Badge>
              </button>
            );
          })}
        </div>
      )}

      <Dialog
        open={open}
        onOpenChange={next => {
          setOpen(next);
          if (!next) resetForm();
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo laudo · {equipment.label || equipment.type || "Equipamento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {linkable.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  <CalendarClock className="w-3 h-3" /> Vincular a uma visita?
                </Label>
                <select
                  className="w-full text-sm border rounded-md px-3 py-2 bg-white"
                  value={appointmentId}
                  onChange={e => setAppointmentId(e.target.value)}
                >
                  <option value="none">Nenhuma — laudo avulso</option>
                  {linkable.map(row => {
                    const a = row.appointment;
                    const when = new Date(a.scheduledAt).toLocaleString("pt-BR", {
                      dateStyle: "short", timeStyle: "short",
                    });
                    const tag = a.equipmentId === equipment.id ? " · já vinculada" : "";
                    return (
                      <option key={a.id} value={a.id}>
                        Visita de {when}{tag}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[11px] text-gray-500">
                  Esse cliente tem visita agendada. Vincular ajuda a manter o histórico organizado.
                </p>
              </div>
            )}

            <div>
              <Label className="text-xs">Diagnóstico inicial (opcional)</Label>
              <Textarea
                value={diagnosis}
                onChange={e => setDiagnosis(e.target.value)}
                placeholder="Ex: Equipamento com baixo rendimento, ruído anormal..."
                rows={3}
              />
            </div>

            <div>
              <Label className="text-xs">Lista de serviços a executar</Label>
              <div className="space-y-2 mt-1">
                {items.map((it, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      value={it}
                      onChange={e => {
                        const next = [...items]; next[idx] = e.target.value; setItems(next);
                      }}
                      placeholder={`Item ${idx + 1}`}
                    />
                    {items.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => setItems(items.filter((_, i) => i !== idx))}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setItems([...items, ""])}>
                  <Plus className="w-3 h-3 mr-1" /> Adicionar item
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar laudo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
