import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Wrench, Navigation, Loader2, MapPin, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/authContext";
import { providerService } from "@/services/provider";
import type { ITravelConfig } from "@/services/auth";
import { getApiErrorMessage, getFieldErrors } from "@/services/apiError";
import { FieldError } from "@/components/ui/field-error";

const reaisToCents = (v: string) => Math.round((parseFloat(v.replace(",", ".")) || 0) * 100);
const centsToReais = (c: number | null | undefined) => ((c ?? 0) / 100).toFixed(2);
const onlyDigits = (v: string) => v.replace(/\D/g, "");

/**
 * Toggles de cobrança do provider (mão de obra / deslocamento). Persiste em
 * `PUT /providers/me/config` e reflete no provider do auth (otimista, com rollback).
 */
export function ChargesCard() {
  const { provider, token, updateProvider } = useAuth();
  const [saving, setSaving] = useState<"labor" | "travel" | null>(null);

  if (!provider) return null;

  const save = async (next: { chargesLabor: boolean; chargesTravel: boolean }, which: "labor" | "travel") => {
    if (!token) return;
    const prev = { chargesLabor: provider.chargesLabor, chargesTravel: provider.chargesTravel };
    updateProvider(next); // otimista
    setSaving(which);
    try {
      const updated = await providerService.updateConfig(token, next);
      updateProvider({ chargesLabor: updated.chargesLabor, chargesTravel: updated.chargesTravel });
    } catch (e) {
      updateProvider(prev); // rollback
      toast.error(getApiErrorMessage(e, "Não foi possível salvar"));
    } finally {
      setSaving(null);
    }
  };

  return (
    <Card>
      <CardContent className="py-4 space-y-1">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">O que você cobra</h3>
          <p className="text-xs text-gray-500">
            Defina o que entra nos seus laudos. Você ajusta os valores em cada laudo.
          </p>
        </div>

        <ToggleRow
          icon={<Wrench className="w-4 h-4" />}
          title="Mão de obra"
          desc="Cobra pela execução do serviço (além das peças)."
          checked={provider.chargesLabor}
          disabled={saving !== null}
          onChange={v => save({ chargesLabor: v, chargesTravel: provider.chargesTravel }, "labor")}
        />

        <ToggleRow
          icon={<Navigation className="w-4 h-4" />}
          title="Deslocamento"
          desc="Cobra a visita/deslocamento até o cliente."
          checked={provider.chargesTravel}
          disabled={saving !== null}
          onChange={v => save({ chargesLabor: provider.chargesLabor, chargesTravel: v }, "travel")}
        />

        {provider.chargesTravel && (
          <TravelConfigForm travel={provider.travel} />
        )}
      </CardContent>
    </Card>
  );
}

function TravelConfigForm({ travel }: { travel: ITravelConfig | null }) {
  const { token, updateProvider } = useAuth();
  const [cep, setCep] = useState(travel?.originCep ?? "");
  const [perKm, setPerKm] = useState(centsToReais(travel?.pricePerKmCents));
  const [freeKm, setFreeKm] = useState(String(travel?.freeRadiusKm ?? 0));
  const [min, setMin] = useState(centsToReais(travel?.minCents));
  const [cap, setCap] = useState(travel?.capCents != null ? centsToReais(travel.capCents) : "");
  const [roundTrip, setRoundTrip] = useState(travel?.roundTrip ?? true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null);

  const geocoded = !!travel?.originGeocoded;

  const handleSave = async () => {
    if (!token) return;
    if (onlyDigits(cep).length !== 8) {
      toast.error("Informe um CEP de origem válido (8 dígitos).");
      return;
    }
    setFieldErrors(null);
    setSaving(true);
    try {
      const updated = await providerService.updateTravelConfig(token, {
        travelOriginCep: onlyDigits(cep),
        travelPricePerKmCents: reaisToCents(perKm),
        travelFreeRadiusKm: parseFloat(freeKm.replace(",", ".")) || 0,
        travelMinCents: reaisToCents(min),
        travelCapCents: cap.trim() ? reaisToCents(cap) : null,
        travelRoundTrip: roundTrip,
      });
      updateProvider({ travel: updated.travel });
      toast.success("Tarifa de deslocamento salva!");
    } catch (err) {
      const fields = getFieldErrors(err);
      if (fields) {
        setFieldErrors(fields);
      } else {
        toast.error(getApiErrorMessage(err, "Não foi possível salvar a tarifa"));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50/60 p-3 space-y-3">
      <div className="flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-blue-600" />
        <p className="text-xs font-semibold text-gray-800">Tarifa de deslocamento (por km)</p>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">CEP de origem (sua base)</Label>
        <Input
          inputMode="numeric"
          placeholder="00000-000"
          value={cep}
          onChange={e => setCep(onlyDigits(e.target.value).slice(0, 8))}
          aria-invalid={!!fieldErrors?.travelOriginCep}
        />
        <FieldError message={fieldErrors?.travelOriginCep} />
        {cep && onlyDigits(cep).length === 8 && !geocoded && (
          <p className="text-[11px] text-amber-700 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            Salve para localizar a base. Sem coordenadas, a estimativa por km fica indisponível.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Preço por km (R$)">
          <Input inputMode="decimal" value={perKm} onChange={e => setPerKm(e.target.value)} />
        </Field>
        <Field label="Raio de cortesia (km)">
          <Input inputMode="decimal" value={freeKm} onChange={e => setFreeKm(e.target.value)} />
        </Field>
        <Field label="Mínimo (R$)">
          <Input inputMode="decimal" value={min} onChange={e => setMin(e.target.value)} />
        </Field>
        <Field label="Teto (R$, opcional)">
          <Input inputMode="decimal" placeholder="sem teto" value={cap} onChange={e => setCap(e.target.value)} />
        </Field>
      </div>

      <div className="flex items-center justify-between gap-3 py-1">
        <div>
          <p className="text-sm font-medium text-gray-800">Ida e volta</p>
          <p className="text-xs text-gray-500">Dobra a distância no cálculo.</p>
        </div>
        <Switch checked={roundTrip} onCheckedChange={setRoundTrip} disabled={saving} />
      </div>

      <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700" onClick={handleSave} disabled={saving}>
        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Salvar tarifa
      </Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function ToggleRow({
  icon, title, desc, checked, disabled, onChange,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  checked: boolean;
  disabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-t first:border-t-0 border-gray-100">
      <span className="w-9 h-9 rounded-md bg-gray-50 text-gray-500 flex items-center justify-center shrink-0">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-800">{title}</p>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  );
}
