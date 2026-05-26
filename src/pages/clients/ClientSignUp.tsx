import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { clientService } from "@/services/client";
import type { EquipmentType, Shift } from "@/services/enums";
import {
  availabilityService,
  type ISignUpProviderResponse,
  type IShiftSlot,
} from "@/services/availability";
import { SignUpHeader } from "./components/SignUpHeader";
import { SignUpStepIndicator } from "./components/SignUpStepIndicator";
import { SignUpDataForm, type SignUpFormData } from "./components/SignUpDataForm";
import { SignUpCalendarCard } from "./components/SignUpCalendarCard";
import { SignUpTimeSlotsCard } from "./components/SignUpTimeSlotsCard";
import { SignUpSuccessScreen } from "./components/SignUpSuccessScreen";

const fmtDateLocal = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function ClientSignUp() {
  const { publicToken: token } = useParams<{ publicToken: string }>();

  const [data, setData] = useState<ISignUpProviderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<SignUpFormData | null>(null);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [shifts, setShifts] = useState<IShiftSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  useEffect(() => {
    if (!token) return;
    availabilityService.getSignUpProvider(token)
      .then(setData)
      .catch(() => setError("Link inválido."))
      .finally(() => setLoading(false));
  }, [token]);

  const handleStep1Submit = (d: SignUpFormData) => {
    setFormData(d);
    setStep(2);
    window.scrollTo(0, 0);
  };

  const handleSelectDate = async (date: Date) => {
    setSelectedDate(date);
    setSelectedShift(null);
    setShifts([]);
    setLoadingSlots(true);
    try {
      const dateStr = fmtDateLocal(date);
      const res = await availabilityService.getSignUpSlots(token!, dateStr);
      setShifts(res.shifts ?? []);
    } catch {
      toast.error("Erro ao carregar turnos");
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedShift || !selectedDate || !token || !formData) return;
    setSubmitting(true);
    try {
      await clientService.signUpSubmit(token, {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        cep: formData.address.cep.replace(/\D/g, ""),
        street: formData.address.street,
        streetNumber: parseInt(formData.address.streetNumber) || 0,
        complement: formData.address.complement || undefined,
        neighborhood: formData.address.neighborhood,
        city: formData.address.city,
        state: formData.address.state,
        description: formData.description,
        photoUrls: formData.photoUrls,
        equipmentType: formData.equipmentType as EquipmentType,
        equipmentBrand: formData.equipmentBrand || undefined,
        equipmentModel: formData.equipmentModel || undefined,
        equipmentLabel: formData.equipmentLabel || undefined,
        problemType: formData.problemType || undefined,
        scheduledDate: fmtDateLocal(selectedDate),
        shift: selectedShift,
      });
      setSubmitted(true);
    } catch {
      toast.error("Erro ao agendar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const prevMonth = () =>
    viewMonth === 0 ? (setViewYear(y => y - 1), setViewMonth(11)) : setViewMonth(m => m - 1);
  const nextMonth = () =>
    viewMonth === 11 ? (setViewYear(y => y + 1), setViewMonth(0)) : setViewMonth(m => m + 1);

  if (loading) return (
    <div className="min-h-dvh flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  if (error) return (
    <div className="min-h-dvh flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900">Link inválido</h2>
        <p className="text-gray-500">{error}</p>
      </div>
    </div>
  );

  if (submitted && selectedShift && selectedDate) {
    const selectedShiftSlot = shifts.find(s => s.shift === selectedShift);
    return (
      <SignUpSuccessScreen
        providerName={data?.provider?.companyName ?? data?.provider?.name ?? ""}
        scheduledDate={fmtDateLocal(selectedDate)}
        shift={selectedShift}
        shiftHours={selectedShiftSlot
          ? { startTime: selectedShiftSlot.startTime, endTime: selectedShiftSlot.endTime }
          : undefined}
      />
    );
  }

  const provider = data?.provider;
  const activeDays = data?.activeDaysOfWeek ?? [];

  return (
    <div className="min-h-dvh bg-linear-to-br from-blue-50 to-slate-100 px-4 py-8">
      <div className="max-w-lg mx-auto space-y-6">
        <SignUpHeader providerName={provider?.companyName ?? provider?.name ?? ""} />
        <SignUpStepIndicator step={step} />

        {step === 1 && <SignUpDataForm onSubmit={handleStep1Submit} />}

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
                shifts={shifts}
                loading={loadingSlots}
                selectedShift={selectedShift}
                onSelectShift={setSelectedShift}
              />
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Voltar</Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={!selectedShift || submitting}
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
