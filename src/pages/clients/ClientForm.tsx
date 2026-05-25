import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Wind, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { clientService } from "@/services/client";
import { availabilityService } from "@/services/availability";
import { uploadService } from "@/services/upload";
import { SignUpStepIndicator } from "./components/SignUpStepIndicator";
import { SignUpCalendarCard } from "./components/SignUpCalendarCard";
import { SignUpTimeSlotsCard } from "./components/SignUpTimeSlotsCard";
import { EquipmentSelectorCard, type NewEquipmentData } from "./components/EquipmentSelectorCard";
import { PhotoUploadGrid } from "./components/PhotoUploadGrid";

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
  const [equipments, setEquipments] = useState<Parameters<typeof EquipmentSelectorCard>[0]["equipments"]>([]);
  const [activeDays, setActiveDays] = useState<number[]>([]);

  const [step, setStep] = useState<1 | 2>(1);
  const [scheduledEquipmentIds, setScheduledEquipmentIds] = useState<string[]>([]);
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([]);
  const [addingNew, setAddingNew] = useState(false);
  const [newEquipment, setNewEquipment] = useState<NewEquipmentData>({ type: "", brand: "", model: "", label: "" });
  const [problemType, setProblemType] = useState("");
  const [description, setDescription] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

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
        const blocked = portal.appointments
          .filter(a => a.status === "scheduled")
          .flatMap(a => a.equipmentIds);
        setScheduledEquipmentIds(blocked);
        const firstAvailable = portal.equipments.find(e => !blocked.includes(e.id));
        if (firstAvailable) {
          setSelectedEquipmentIds([firstAvailable.id]);
          setAddingNew(false);
        } else {
          setSelectedEquipmentIds([]);
          setAddingNew(true);
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

  const handlePhotosSelected = async (files: File[]) => {
    setUploadingPhotos(true);
    try {
      const uploaded = await Promise.all(files.map(f => uploadService.uploadPublic(f)));
      setPhotoUrls(prev => [...prev, ...uploaded]);
    } catch {
      toast.error("Erro ao enviar foto. Tente novamente.");
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleStep1Next = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!description.trim()) { toast.error("Descreva o problema"); return; }
    if (selectedEquipmentIds.length === 0 && !addingNew) { toast.error("Selecione pelo menos um equipamento"); return; }
    if (addingNew && !newEquipment.type) { toast.error("Selecione o tipo do novo equipamento"); return; }
    setStep(2);
    window.scrollTo(0, 0);
  };

  const handleConfirm = async () => {
    if (!selectedSlot || !publicToken || !id) return;
    setSubmitting(true);
    try {
      await clientService.requestAppointment(publicToken, id, {
        equipmentIds: selectedEquipmentIds.length > 0 ? selectedEquipmentIds : undefined,
        equipmentType: addingNew && newEquipment.type ? newEquipment.type : undefined,
        equipmentBrand: addingNew && newEquipment.brand ? newEquipment.brand : undefined,
        equipmentModel: addingNew && newEquipment.model ? newEquipment.model : undefined,
        equipmentLabel: addingNew && newEquipment.label ? newEquipment.label : undefined,
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

  return (
    <div className="min-h-dvh bg-linear-to-br from-blue-50 to-slate-100 px-4 py-8">
      <div className="max-w-lg mx-auto space-y-6">

        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg">
            <Wind className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{providerName}</h1>
          <p className="text-gray-500 text-sm">Olá, {clientName}! Solicite um novo agendamento abaixo.</p>
        </div>

        <SignUpStepIndicator step={step} step1Label="Problema" />

        {step === 1 && (
          <form onSubmit={handleStep1Next} className="space-y-4">
            <EquipmentSelectorCard
              equipments={equipments}
              selectedIds={selectedEquipmentIds}
              onToggle={id => setSelectedEquipmentIds(prev =>
                prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
              )}
              showNew={addingNew}
              onToggleNew={() => setAddingNew(v => !v)}
              newData={newEquipment}
              onNewDataChange={(field, value) => setNewEquipment(prev => ({ ...prev, [field]: value }))}
              scheduledEquipmentIds={scheduledEquipmentIds}
            />

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
              <CardContent>
                <PhotoUploadGrid
                  photos={photoUrls}
                  onFilesSelected={handlePhotosSelected}
                  onRemove={idx => setPhotoUrls(prev => prev.filter((_, i) => i !== idx))}
                  uploading={uploadingPhotos}
                />
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
                disabled={!selectedSlot || submitting || uploadingPhotos}
                onClick={handleConfirm}
              >
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirmar agendamento
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
