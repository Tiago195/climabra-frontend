import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wind, Loader2, Upload, X, AlertCircle, Plus, AirVent } from "lucide-react";
import { toast } from "sonner";
import { clientService, type IPortalEquipment } from "@/services/client";
import { availabilityService } from "@/services/availability";
import { SignUpCalendarCard } from "./components/SignUpCalendarCard";
import { SignUpTimeSlotsCard } from "./components/SignUpTimeSlotsCard";

const EQUIPMENT_TYPES = [
  { value: "split", label: "Split" },
  { value: "janela", label: "Janela" },
  { value: "central", label: "Central" },
  { value: "cassete", label: "Cassete" },
  { value: "piso_teto", label: "Piso-teto" },
  { value: "portatil", label: "Portátil" },
];

const PROBLEM_TYPES = [
  { value: "nao_gela", label: "Não está gelando" },
  { value: "barulho", label: "Fazendo barulho" },
  { value: "vazamento", label: "Vazando água" },
  { value: "nao_liga", label: "Não liga" },
  { value: "manutencao", label: "Manutenção preventiva" },
  { value: "instalacao", label: "Instalação" },
  { value: "outro", label: "Outro" },
];

export default function ClientForm() {
  const { publicToken, id } = useParams<{ publicToken: string; id: string }>();
  const navigate = useNavigate();

  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [providerName, setProviderName] = useState("");
  const [clientName, setClientName] = useState("");
  const [equipments, setEquipments] = useState<IPortalEquipment[]>([]);
  const [activeDays, setActiveDays] = useState<number[]>([]);

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>("new");
  const [equipmentType, setEquipmentType] = useState("");
  const [equipmentBrand, setEquipmentBrand] = useState("");
  const [equipmentModel, setEquipmentModel] = useState("");
  const [equipmentLabel, setEquipmentLabel] = useState("");
  const [problemType, setProblemType] = useState("");
  const [description, setDescription] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!publicToken || !id) return;
    Promise.all([
      clientService.getPortal(publicToken, id),
      availabilityService.getSignUpProvider(publicToken),
    ])
      .then(([portal, providerData]) => {
        setProviderName(providerData.provider.companyName ?? providerData.provider.name);
        setClientName(portal.client.name);
        setEquipments(portal.equipments);
        setActiveDays(providerData.activeDaysOfWeek);
        if (portal.equipments.length > 0) {
          setSelectedEquipmentId(portal.equipments[0].id);
        }
      })
      .catch(() => setError("Link inválido ou expirado."))
      .finally(() => setLoadingData(false));
  }, [publicToken, id]);

  const handleSelectDate = async (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setSlots([]);
    setLoadingSlots(true);
    try {
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const res = await availabilityService.getSignUpSlots(publicToken!, dateStr);
      setSlots(res.slots ?? []);
    } catch {
      toast.error("Erro ao carregar horários");
    } finally {
      setLoadingSlots(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (photoUrls.length + files.length > 5) {
      toast.error("Máximo de 5 fotos");
      return;
    }
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setPhotoUrls(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const handleStep1Next = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("Descreva o problema");
      return;
    }
    if (selectedEquipmentId === "new" && !equipmentType) {
      toast.error("Selecione o tipo do ar-condicionado");
      return;
    }
    setStep(2);
    window.scrollTo(0, 0);
  };

  const handleConfirm = async () => {
    if (!selectedSlot || !publicToken || !id) return;
    setSubmitting(true);
    try {
      await clientService.requestAppointment(publicToken, id, {
        equipmentId: selectedEquipmentId !== "new" ? selectedEquipmentId : undefined,
        equipmentType: selectedEquipmentId === "new" ? equipmentType : undefined,
        equipmentBrand: selectedEquipmentId === "new" && equipmentBrand ? equipmentBrand : undefined,
        equipmentModel: selectedEquipmentId === "new" && equipmentModel ? equipmentModel : undefined,
        equipmentLabel: selectedEquipmentId === "new" && equipmentLabel ? equipmentLabel : undefined,
        description,
        photoUrls,
        problemType: problemType || undefined,
        scheduledAt: selectedSlot,
      });
      toast.success("Agendamento solicitado com sucesso!");
      navigate(`/providers/${publicToken}/clients/${id}`);
    } catch {
      toast.error("Erro ao enviar solicitação");
    } finally {
      setSubmitting(false);
    }
  };

  const prevMonth = () =>
    viewMonth === 0 ? (setViewYear(y => y - 1), setViewMonth(11)) : setViewMonth(m => m - 1);
  const nextMonth = () =>
    viewMonth === 11 ? (setViewYear(y => y + 1), setViewMonth(0)) : setViewMonth(m => m + 1);

  if (loadingData) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900">Link inválido</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  const isNewEquipment = selectedEquipmentId === "new";

  return (
    <div className="min-h-dvh bg-linear-to-br from-blue-50 to-slate-100 px-4 py-8">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg">
            <Wind className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{providerName}</h1>
          <p className="text-gray-500 text-sm">
            Olá, {clientName}! Solicite um novo agendamento abaixo.
          </p>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step === 1 ? "bg-blue-600 text-white" : "bg-green-500 text-white"}`}>1</div>
            <span className={step === 1 ? "font-medium text-blue-600" : "text-green-600"}>Problema</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200 mx-3" />
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step === 2 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400"}`}>2</div>
            <span className={step === 2 ? "font-medium text-blue-600" : "text-gray-400"}>Agendamento</span>
          </div>
        </div>

        {step === 1 && (
          <form onSubmit={handleStep1Next} className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AirVent className="w-4 h-4 text-blue-600" /> Ar-condicionado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {equipments.length > 0 && (
                  <div className="space-y-2">
                    {equipments.map(eq => (
                      <label
                        key={eq.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                          selectedEquipmentId === eq.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="equipment"
                          checked={selectedEquipmentId === eq.id}
                          onChange={() => setSelectedEquipmentId(eq.id)}
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
                        </div>
                      </label>
                    ))}
                    <label
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                        isNewEquipment ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400"
                      }`}
                    >
                      <input
                        type="radio"
                        name="equipment"
                        checked={isNewEquipment}
                        onChange={() => setSelectedEquipmentId("new")}
                      />
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Plus className="w-4 h-4" /> Adicionar outro ar-condicionado
                      </div>
                    </label>
                  </div>
                )}

                {isNewEquipment && (
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
                        value={equipmentLabel}
                        onChange={e => setEquipmentLabel(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Tipo *</Label>
                        <select
                          className="w-full text-sm border rounded-md px-3 py-2 bg-white"
                          value={equipmentType}
                          onChange={e => setEquipmentType(e.target.value)}
                          required={isNewEquipment}
                        >
                          <option value="">Selecionar...</option>
                          {EQUIPMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Marca</Label>
                        <Input
                          placeholder="Ex: LG, Samsung..."
                          value={equipmentBrand}
                          onChange={e => setEquipmentBrand(e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Modelo</Label>
                      <Input
                        placeholder="Ex: 9000 BTUs, Inverter..."
                        value={equipmentModel}
                        onChange={e => setEquipmentModel(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Tipo de problema</CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  className="w-full text-sm border rounded-md px-3 py-2 bg-white"
                  value={problemType}
                  onChange={e => setProblemType(e.target.value)}
                >
                  <option value="">Selecionar...</option>
                  {PROBLEM_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Fotos do equipamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {photoUrls.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhotoUrls(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {photoUrls.length < 5 && (
                    <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                      <Upload className="w-5 h-5 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-400">Adicionar</span>
                      <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  )}
                </div>
                <p className="text-xs text-gray-400">Até 5 fotos do equipamento e do local</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Descrição do problema *</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Descreva com detalhes o que está acontecendo..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </CardContent>
            </Card>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base">
              Continuar para agendamento
            </Button>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <SignUpCalendarCard
              activeDays={activeDays}
              year={viewYear}
              month={viewMonth}
              selectedDate={selectedDate}
              onPrevMonth={prevMonth}
              onNextMonth={nextMonth}
              onSelectDate={handleSelectDate}
            />

            {selectedDate && (
              <SignUpTimeSlotsCard
                date={selectedDate}
                slots={slots}
                loading={loadingSlots}
                selectedSlot={selectedSlot}
                onSelectSlot={setSelectedSlot}
              />
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={!selectedSlot || submitting}
                onClick={handleConfirm}
              >
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Confirmar agendamento
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
