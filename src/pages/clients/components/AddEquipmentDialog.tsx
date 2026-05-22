import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { clientService, type IPortalEquipment } from "@/services/client";

const EQUIPMENT_TYPES = [
  { value: "split", label: "Split" },
  { value: "janela", label: "Janela" },
  { value: "central", label: "Central" },
  { value: "cassete", label: "Cassete" },
  { value: "piso_teto", label: "Piso-teto" },
  { value: "portatil", label: "Portátil" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  publicToken: string;
  clientId: string;
  onAdded: (equipment: IPortalEquipment) => void;
}

export function AddEquipmentDialog({ open, onClose, publicToken, clientId, onAdded }: Props) {
  const [type, setType] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => { setType(""); setBrand(""); setModel(""); setLabel(""); };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type) { toast.error("Selecione o tipo do equipamento"); return; }
    setSaving(true);
    try {
      const equipment = await clientService.addEquipment(publicToken, clientId, {
        type,
        brand: brand || undefined,
        model: model || undefined,
        label: label || undefined,
      });
      toast.success("Equipamento adicionado!");
      onAdded(equipment);
      handleClose();
    } catch {
      toast.error("Erro ao adicionar equipamento");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Adicionar equipamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label className="text-xs">Apelido (opcional)</Label>
            <Input
              placeholder="Ex: Ar da sala, Quarto principal..."
              value={label}
              onChange={e => setLabel(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Tipo *</Label>
            <select
              className="w-full text-sm border rounded-md px-3 py-2 bg-white"
              value={type}
              onChange={e => setType(e.target.value)}
            >
              <option value="">Selecionar...</option>
              {EQUIPMENT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Marca</Label>
              <Input placeholder="Ex: LG, Samsung..." value={brand} onChange={e => setBrand(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Modelo</Label>
              <Input placeholder="Ex: 9000 BTUs..." value={model} onChange={e => setModel(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={handleClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
