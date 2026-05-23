/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-refresh/only-export-components */
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search } from "lucide-react";

export type AddressData = {
  cep: string;
  street: string;
  streetNumber: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

export const emptyAddress: AddressData = {
  cep: "", street: "", streetNumber: "", complement: "", neighborhood: "", city: "", state: "",
};

export function buildAddressString(a: AddressData): string {
  const parts: string[] = [];
  if (a.street) parts.push(a.street + (a.streetNumber ? `, ${a.streetNumber}` : ""));
  if (a.complement) parts.push(a.complement);
  if (a.neighborhood) parts.push(a.neighborhood);
  if (a.city) parts.push(a.city + (a.state ? `/${a.state}` : ""));
  if (a.cep) parts.push(`CEP ${a.cep}`);
  return parts.join(" - ");
}

type Props = {
  value: AddressData;
  onChange: (next: AddressData) => void;
  compact?: boolean;
};

export default function AddressFieldsForm({ value, onChange, compact = false }: Props) {
  const [lookingUp, setLookingUp] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  const valueRef = useRef(value);
  useEffect(() => { valueRef.current = value; }, [value]);

  const lookupAbort = useRef<AbortController | null>(null);

  const update = (patch: Partial<AddressData>) => onChange({ ...valueRef.current, ...patch });

  const formatCep = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
  };

  const lookupCep = async (cep: string) => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    lookupAbort.current?.abort();
    const ctrl = new AbortController();
    lookupAbort.current = ctrl;
    setLookingUp(true);
    setCepError(null);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal: ctrl.signal });
      const data = await res.json();
      if (ctrl.signal.aborted) return;
      if (data.erro) {
        setCepError("CEP não encontrado");
        return;
      }
      const latest = valueRef.current;
      onChange({
        ...latest,
        cep: formatCep(digits),
        street: latest.street || (data.logradouro ?? ""),
        neighborhood: latest.neighborhood || (data.bairro ?? ""),
        city: latest.city || (data.localidade ?? ""),
        state: latest.state || (data.uf ?? ""),
        complement: latest.complement,
      });
    } catch (err: any) {
      if (err?.name !== "AbortError") setCepError("Erro ao buscar CEP");
    } finally {
      if (!ctrl.signal.aborted) setLookingUp(false);
    }
  };

  const labelClass = compact ? "text-xs" : "";

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className={labelClass}>CEP</Label>
        <div className="relative">
          <Input
            value={value.cep}
            onChange={e => {
              const formatted = formatCep(e.target.value);
              update({ cep: formatted });
              if (formatted.replace(/\D/g, "").length === 8) lookupCep(formatted);
            }}
            placeholder="00000-000"
            inputMode="numeric"
            maxLength={9}
          />
          {lookingUp && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-blue-600" />
          )}
          {!lookingUp && value.cep.replace(/\D/g, "").length === 8 && (
            <button
              type="button"
              onClick={() => lookupCep(value.cep)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
              aria-label="Buscar CEP"
            >
              <Search className="w-4 h-4" />
            </button>
          )}
        </div>
        {cepError && <p className="text-xs text-red-500">{cepError}</p>}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1 col-span-2">
          <Label className={labelClass}>Rua</Label>
          <Input value={value.street} onChange={e => update({ street: e.target.value })} placeholder="Nome da rua" />
        </div>
        <div className="space-y-1">
          <Label className={labelClass}>Número</Label>
          <Input
            value={value.streetNumber}
            onChange={e => update({ streetNumber: e.target.value.replace(/\D/g, "") })}
            placeholder="123"
            inputMode="numeric"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className={labelClass}>Complemento</Label>
        <Input value={value.complement} onChange={e => update({ complement: e.target.value })} placeholder="Apto, bloco, referência..." />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className={labelClass}>Bairro</Label>
          <Input value={value.neighborhood} onChange={e => update({ neighborhood: e.target.value })} placeholder="Bairro" />
        </div>
        <div className="space-y-1">
          <Label className={labelClass}>Cidade</Label>
          <Input value={value.city} onChange={e => update({ city: e.target.value })} placeholder="Cidade" />
        </div>
      </div>

      <div className="space-y-1">
        <Label className={labelClass}>Estado</Label>
        <Input value={value.state} onChange={e => update({ state: e.target.value.toUpperCase().slice(0, 2) })} placeholder="UF" maxLength={2} />
      </div>
    </div>
  );
}
