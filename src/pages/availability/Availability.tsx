import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { useAuth } from "@/contexts/authContext"
import {
  availabilityService,
  type AvailabilityDTO,
  type IExceptionResponse,
} from "@/services/availability"
import { AvailabilityInfoCard } from "./components/AvailabilityInfoCard"
import { DayCard, type DayConfig } from "./components/DayCard"
import { FloatingSaveButton } from "./components/FloatingSaveButton"
import { ExceptionsCalendarCard } from "./components/ExceptionsCalendarCard"
import { ExceptionsList } from "./components/ExceptionsList"
import { AddExceptionDialog } from "./components/AddExceptionDialog"

const DAYS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
]

export function Availability() {
  const { token } = useAuth()
  const [availability, setAvailability] = useState<AvailabilityDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [localConfig, setLocalConfig] = useState<Record<number, DayConfig>>({})

  const [exceptions, setExceptions] = useState<IExceptionResponse[]>([])
  const [loadingExceptions, setLoadingExceptions] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogInitialDate, setDialogInitialDate] = useState<string | undefined>(undefined)
  const [deletingExceptionId, setDeletingExceptionId] = useState<string | null>(null)

  const hasChanges = Object.keys(localConfig).length > 0

  useEffect(() => {
    if (!token) return
    availabilityService.list(token)
      .then(setAvailability)
      .catch(() => toast.error("Erro ao carregar disponibilidade"))
      .finally(() => setLoading(false))

    availabilityService.listExceptions(token)
      .then(setExceptions)
      .catch(() => toast.error("Erro ao carregar exceções"))
      .finally(() => setLoadingExceptions(false))
  }, [token])

  const getConfig = (dayOfWeek: number): DayConfig => {
    if (localConfig[dayOfWeek]) return localConfig[dayOfWeek]
    const existing = availability.find(a => a.dayOfWeek === dayOfWeek)
    return existing ?? {
      dayOfWeek,
      startTime: "08:00",
      endTime: "18:00",
      slotDurationMinutes: 60,
      isActive: false,
    }
  }

  const updateLocal = (dayOfWeek: number, updates: Partial<DayConfig>) => {
    setLocalConfig(prev => ({
      ...prev,
      [dayOfWeek]: { ...getConfig(dayOfWeek), ...updates },
    }))
  }

  const handleSaveAll = async () => {
    if (!token) return
    setSaving(true)
    try {
      const results = await Promise.all(
        Object.values(localConfig).map(config => availabilityService.upsert(token, config))
      )
      setAvailability(prev => {
        const updated = [...prev]
        for (const saved of results) {
          const idx = updated.findIndex(a => a.dayOfWeek === saved.dayOfWeek)
          if (idx >= 0) updated[idx] = saved
          else updated.push(saved)
        }
        return updated
      })
      setLocalConfig({})
      toast.success("Disponibilidade salva!")
    } catch {
      toast.error("Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  const handleOpenAddException = (date?: string) => {
    setDialogInitialDate(date)
    setDialogOpen(true)
  }

  const handleExceptionCreated = (created: IExceptionResponse) => {
    setExceptions(prev => {
      const next = [...prev, created]
      next.sort((a, b) => a.startDate.localeCompare(b.startDate))
      return next
    })
  }

  const handleDeleteException = async (id: string) => {
    if (!token) return
    setDeletingExceptionId(id)
    try {
      await availabilityService.deleteException(token, id)
      setExceptions(prev => prev.filter(e => e.id !== id))
      toast.success("Exceção removida")
    } catch {
      toast.error("Erro ao remover exceção")
    } finally {
      setDeletingExceptionId(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurar Agenda</h1>
        <p className="text-gray-500 text-sm">Defina seus dias e horários de atendimento</p>
      </div>

      <AvailabilityInfoCard />

      {loading ? (
        <div className="space-y-4">{[...Array(7)].map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
      ) : (
        <div className="space-y-4">
          {DAYS.map(day => (
            <DayCard
              key={day.value}
              label={day.label}
              config={getConfig(day.value)}
              isDirty={!!localConfig[day.value]}
              onToggle={(checked) => updateLocal(day.value, { isActive: checked })}
              onUpdate={(updates) => updateLocal(day.value, updates)}
            />
          ))}
        </div>
      )}

      {loadingExceptions ? (
        <Card>
          <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
          <CardContent><Skeleton className="h-64 w-full" /></CardContent>
        </Card>
      ) : (
        <>
          <ExceptionsCalendarCard
            exceptions={exceptions}
            onAddClick={handleOpenAddException}
          />
          <Card>
            <CardContent className="pt-6">
              <ExceptionsList
                exceptions={exceptions}
                onDelete={handleDeleteException}
                deletingId={deletingExceptionId}
              />
            </CardContent>
          </Card>
        </>
      )}

      <AddExceptionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialDate={dialogInitialDate}
        onCreated={handleExceptionCreated}
      />

      {hasChanges && <FloatingSaveButton saving={saving} onClick={handleSaveAll} />}
    </div>
  )
}
