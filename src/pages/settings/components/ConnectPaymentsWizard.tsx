/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AddressFieldsForm, { emptyAddress, type AddressData } from "@/components/AddressFieldsForm";
import { AsaasDisclosure } from "@/components/AsaasDisclosure";
import { useAuth } from "@/contexts/authContext";
import { paymentService, type CompanyType, type IPaymentSettings } from "@/services/payment";
import { Loader2, ArrowLeft, ArrowRight, Building2, User } from "lucide-react";
import { toast } from "sonner";

type PersonType = "PF" | "PJ";

const COMPANY_TYPES: { value: CompanyType; label: string }[] = [
  { value: "MEI", label: "MEI" },
  { value: "LIMITED", label: "Sociedade limitada (LTDA)" },
  { value: "INDIVIDUAL", label: "Empresário individual (EI)" },
  { value: "ASSOCIATION", label: "Associação" },
];

interface Props {
  onConnected: (settings: IPaymentSettings) => void;
  onCancel: () => void;
}

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const labels = ["Dados", "Endereço", "Revisão"];
  return (
    <div className="flex items-center justify-between text-sm">
      {labels.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step >= n ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400"}`}>{n}</div>
              <span className={step >= n ? "font-medium text-blue-600" : "text-gray-400"}>{label}</span>
            </div>
            {n < 3 && <div className="flex-1 h-0.5 bg-gray-200 mx-3" />}
          </div>
        );
      })}
    </div>
  );
}

const onlyDigits = (s: string) => s.replace(/\D/g, "");

function formatCpf(v: string) {
  const d = onlyDigits(v).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatCnpj(v: string) {
  const d = onlyDigits(v).slice(0, 14);
  return d
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ConnectPaymentsWizard({ onConnected, onCancel }: Props) {
  const { token, updateProvider } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [saving, setSaving] = useState(false);

  const [personType, setPersonType] = useState<PersonType>("PF");
  const [document, setDocument] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [companyType, setCompanyType] = useState<CompanyType | "">("");
  const [incomeCents, setIncomeCents] = useState(0);
  const [address, setAddress] = useState<AddressData>(emptyAddress);

  const docDigits = onlyDigits(document);
  const isPF = personType === "PF";

  const validateStep1 = () => {
    if (isPF && docDigits.length !== 11) { toast.error("Informe um CPF válido"); return false; }
    if (!isPF && docDigits.length !== 14) { toast.error("Informe um CNPJ válido"); return false; }
    if (isPF && !birthDate) { toast.error("Informe sua data de nascimento"); return false; }
    if (!isPF && !companyType) { toast.error("Selecione o tipo de empresa"); return false; }
    if (incomeCents <= 0) { toast.error("Informe o faturamento mensal estimado"); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (onlyDigits(address.cep).length !== 8) { toast.error("Informe um CEP válido"); return false; }
    if (!address.street.trim()) { toast.error("Informe o endereço"); return false; }
    if (!address.streetNumber.trim()) { toast.error("Informe o número"); return false; }
    if (!address.neighborhood.trim()) { toast.error("Informe o bairro"); return false; }
    return true;
  };

  const next = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => (s < 3 ? ((s + 1) as 1 | 2 | 3) : s));
  };

  const back = () => {
    if (step === 1) { onCancel(); return; }
    setStep((s) => ((s - 1) as 1 | 2 | 3));
  };

  const submit = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const settings = await paymentService.connect(token, {
        cpfCnpj: docDigits,
        birthDate: isPF ? birthDate : undefined,
        companyType: !isPF && companyType ? companyType : undefined,
        incomeValueCents: incomeCents,
        postalCode: onlyDigits(address.cep),
        address: address.street.trim(),
        addressNumber: address.streetNumber.trim(),
        province: address.neighborhood.trim(),
      });
      updateProvider({ cpfCnpj: docDigits });
      toast.success("Conta de recebimento criada! Estamos verificando seus dados.");
      onConnected(settings);
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Não foi possível criar sua conta de recebimento");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <StepIndicator step={step} />

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <p className="text-base font-semibold text-gray-900">Seus dados</p>
            <p className="text-sm text-gray-500">Pra ativar os recebimentos, precisamos confirmar quem você é.</p>
          </div>
          <Label className="text-xs text-gray-500">Tipo de cadastro</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => { setPersonType("PF"); setDocument(""); setCompanyType(""); }}
              className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ${isPF ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              <User className="w-4 h-4" /> Pessoa Física
            </button>
            <button
              type="button"
              onClick={() => { setPersonType("PJ"); setDocument(""); setBirthDate(""); }}
              className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ${!isPF ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              <Building2 className="w-4 h-4" /> Pessoa Jurídica
            </button>
          </div>

          <div className="space-y-2">
            <Label>{isPF ? "CPF" : "CNPJ"}</Label>
            <Input
              value={document}
              onChange={(e) => setDocument(isPF ? formatCpf(e.target.value) : formatCnpj(e.target.value))}
              placeholder={isPF ? "000.000.000-00" : "00.000.000/0000-00"}
              inputMode="numeric"
              autoFocus
            />
          </div>

          {isPF && (
            <div className="space-y-2">
              <Label>Data de nascimento</Label>
              <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            </div>
          )}

          {!isPF && (
            <div className="space-y-2">
              <Label>Tipo de empresa</Label>
              <select
                value={companyType}
                onChange={(e) => setCompanyType(e.target.value as CompanyType)}
                className="h-7 w-full min-w-0 rounded-md border border-input bg-input/20 px-2 py-0.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 md:text-xs/relaxed"
              >
                <option value="" disabled>Selecione…</option>
                {COMPANY_TYPES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Faturamento mensal estimado</Label>
            <Input
              value={incomeCents ? formatBRL(incomeCents) : ""}
              onChange={(e) => setIncomeCents(Number(onlyDigits(e.target.value)))}
              placeholder="R$ 0,00"
              inputMode="numeric"
            />
            <p className="text-xs text-gray-500">Uma estimativa do quanto você recebe por mês. Ajuda a definir seus limites.</p>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <p className="text-base font-semibold text-gray-900">Endereço</p>
            <p className="text-sm text-gray-500">Onde sua empresa está registrada.</p>
          </div>
          <AddressFieldsForm value={address} onChange={setAddress} />
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div>
            <p className="text-base font-semibold text-gray-900">Revise e conclua</p>
            <p className="text-sm text-gray-500">Confira tudo antes de enviar pra análise.</p>
          </div>

          <ReviewBlock title="Dados" onEdit={() => setStep(1)}>
            <Row label="Tipo" value={isPF ? "Pessoa Física" : "Pessoa Jurídica"} />
            <Row label={isPF ? "CPF" : "CNPJ"} value={document} />
            {isPF && birthDate && <Row label="Nascimento" value={new Date(birthDate + "T00:00:00").toLocaleDateString("pt-BR")} />}
            {!isPF && companyType && <Row label="Tipo de empresa" value={COMPANY_TYPES.find((c) => c.value === companyType)?.label ?? companyType} />}
            <Row label="Faturamento/mês" value={formatBRL(incomeCents)} />
          </ReviewBlock>

          <ReviewBlock title="Endereço" onEdit={() => setStep(2)}>
            <Row label="Logradouro" value={`${address.street}, ${address.streetNumber}${address.complement ? ` — ${address.complement}` : ""}`} />
            <Row label="Bairro" value={address.neighborhood} />
            {address.city && <Row label="Cidade / UF" value={`${address.city}${address.state ? ` / ${address.state}` : ""}`} />}
            <Row label="CEP" value={address.cep} />
          </ReviewBlock>

          <AsaasDisclosure />
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 md:flex-row md:items-center md:justify-end">
        <Button type="button" variant="outline" onClick={back} disabled={saving} className="w-full md:w-auto gap-2">
          <ArrowLeft className="w-4 h-4" /> {step === 1 ? "Cancelar" : "Voltar"}
        </Button>
        {step < 3 ? (
          <Button type="button" onClick={next} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 gap-2">
            Continuar <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button type="button" onClick={submit} disabled={saving} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Concluir cadastro
          </Button>
        )}
      </div>
    </div>
  );
}

function ReviewBlock({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  return (
    <Card className="bg-gray-50 ring-0">
      <CardContent className="space-y-1.5 text-sm">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{title}</span>
          <button type="button" onClick={onEdit} className="text-xs font-semibold text-blue-600 hover:underline">Editar</button>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900 text-right">{value}</span>
    </div>
  );
}
