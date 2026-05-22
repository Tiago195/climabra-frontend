import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AirVent, Plus } from "lucide-react";
import type { IPortalEquipment } from "@/services/client";

const EQUIPMENT_TYPES = [
  { value: "split", label: "Split" },
  { value: "janela", label: "Janela" },
  { value: "central", label: "Central" },
  { value: "cassete", label: "Cassete" },
  { value: "piso_teto", label: "Piso-teto" },
  { value: "portatil", label: "Portátil" },
];

export interface NewEquipmentData {
  type: string;
  brand: string;
  model: string;
  label: string;
}

interface Props {
  equipments: IPortalEquipment[];
  selectedId: string;
  onSelect: (id: string) => void;
  newData: NewEquipmentData;
  onNewDataChange: (field: keyof NewEquipmentData, value: string) => void;
  scheduledEquipmentIds?: string[];
}

export function EquipmentSelectorCard({ equipments, selectedId, onSelect, newData, onNewDataChange, scheduledEquipmentIds = [] }: Props) {
  const isNew = selectedId === "new";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <AirVent className="w-4 h-4 text-blue-600" /> Ar-condicionado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {equipments.length > 0 && (
          <div className="space-y-2">
            {equipments.map(eq => {
              const blocked = scheduledEquipmentIds.includes(eq.id);
              return (
                <label
                  key={eq.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-colors ${
                    blocked
                      ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                      : selectedId === eq.id
                        ? "border-blue-500 bg-blue-50 cursor-pointer"
                        : "border-gray-200 hover:border-blue-300 cursor-pointer"
                  }`}
                >
                  <input
                    type="radio"
                    name="equipment"
                    checked={selectedId === eq.id}
                    onChange={() => !blocked && onSelect(eq.id)}
                    disabled={blocked}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900">
                      {eq.label || (EQUIPMENT_TYPES.find(t => t.value === eq.type)?.label ?? eq.type ?? "Ar-condicionado")}
                    </p>
                    <p className="text-xs text-gray-500">
                      {[EQUIPMENT_TYPES.find(t => t.value === eq.type)?.label, eq.brand, eq.model]
                        .filter(Boolean).join(" • ") || "Sem detalhes"}
                    </p>
                    {blocked && (
                      <p className="text-xs text-amber-600 mt-1 font-medium">Visita já agendada</p>
                    )}
                  </div>
                </label>
              );
            })}
            <label
              className={`flex items-center gap-3 p-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                isNew ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400"
              }`}
            >
              <input
                type="radio"
                name="equipment"
                checked={isNew}
                onChange={() => onSelect("new")}
              />
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Plus className="w-4 h-4" /> Adicionar outro ar-condicionado
              </div>
            </label>
          </div>
        )}

        {isNew && (
          <div className="space-y-3 pt-2">
            {equipments.length === 0 && (
              <p className="text-xs text-gray-500">
                Cadastre seu ar-condicionado. Nas próximas vezes você poderá só selecioná-lo.
              </p>
            )}
            <div className="space-y-1">
              <Label className="text-xs">Apelido (opcional)</Label>
              <Input
                placeholder="Ex: Ar da sala, Quarto principal..."
                value={newData.label}
                onChange={e => onNewDataChange("label", e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Tipo *</Label>
                <select
                  className="w-full text-sm border rounded-md px-3 py-2 bg-white"
                  value={newData.type}
                  onChange={e => onNewDataChange("type", e.target.value)}
                  required
                >
                  <option value="">Selecionar...</option>
                  {EQUIPMENT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Marca</Label>
                <Input
                  placeholder="Ex: LG, Samsung..."
                  value={newData.brand}
                  onChange={e => onNewDataChange("brand", e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Modelo</Label>
              <Input
                placeholder="Ex: 9000 BTUs, Inverter..."
                value={newData.model}
                onChange={e => onNewDataChange("model", e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
