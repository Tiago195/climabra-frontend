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
import type { Shift } from "@/services/enums"
import { SHIFT_ORDER, DEFAULT_SHIFT_HOURS, trimTime } from "@/lib/shifts"
import { AvailabilityInfoCard } from "./components/AvailabilityInfoCard"
import type { ShiftConfig } from "./components/DayCard"
import { AvailabilityShiftGrid } from "./components/AvailabilityShiftGrid"
import { AvailabilityDayDetail } from "./components/AvailabilityDayDetail"
import { AvailabilityStats } from "./components/AvailabilityStats"
import { FloatingSaveButton } from "./components/FloatingSaveButton"
import { ExceptionsCalendarCard } from "./components/ExceptionsCalendarCard"
import { ExceptionsList } from "./components/ExceptionsList"
import { AddExceptionDialog } from "./components/AddExceptionDialog"

/** Chave única por turno-dia. */
const keyOf = (dayOfWeek: number, shift: Shift) => `${dayOfWeek}-${shift}`

export function Availability() {
  const { token } = useAuth()
  const [availability, setAvailability] = useState<AvailabilityDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  /** Override local de turnos editados antes de salvar. */
  const [localConfig, setLocalConfig] = useState<Record<string, ShiftConfig>>({})
  /** Dia selecionado no card de detalhes. Default: segunda. */
  const [selectedDow, setSelectedDow] = useState(1)

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

  const getConfig = (dayOfWeek: number, shift: Shift): ShiftConfig => {
    const k = keyOf(dayOfWeek, shift)
    if (localConfig[k]) return localConfig[k]
    const existing = availability.find(a => a.dayOfWeek === dayOfWeek && a.shift === shift)
    if (existing) {
      return {
        dayOfWeek,
        shift,
        startTime: trimTime(existing.startTime),
        endTime: trimTime(existing.endTime),
        capacity: existing.capacity,
        isActive: existing.isActive,
      }
    }
    const defaults = DEFAULT_SHIFT_HOURS[shift]
    return {
      dayOfWeek,
      shift,
      startTime: defaults.startTime,
      endTime: defaults.endTime,
      capacity: defaults.capacity,
      isActive: false,
    }
  }

  const isDirty = (dayOfWeek: number, shift: Shift) =>
    !!localConfig[keyOf(dayOfWeek, shift)]

  const updateLocal = (dayOfWeek: number, shift: Shift, updates: Partial<ShiftConfig>) => {
    const k = keyOf(dayOfWeek, shift)
    setLocalConfig(prev => ({
      ...prev,
      [k]: { ...getConfig(dayOfWeek, shift), ...updates },
    }))
  }

  const toggleShift = (dayOfWeek: number, shift: Shift) => {
    const config = getConfig(dayOfWeek, shift)
    updateLocal(dayOfWeek, shift, { isActive: !config.isActive })
  }

  // Stats agregadas considerando overrides locais
  const allShiftConfigs = (() => {
    const list: ShiftConfig[] = []
    for (let dow = 0; dow < 7; dow++) {
      for (const s of SHIFT_ORDER) list.push(getConfig(dow, s))
    }
    return list
  })()
  const activeDays = new Set(
    allShiftConfigs.filter(c => c.isActive).map(c => c.dayOfWeek)
  ).size
  const totalWeekCap = allShiftConfigs
    .filter(c => c.isActive)
    .reduce((sum, c) => sum + c.capacity, 0)

  const handleSaveAll = async () => {
    if (!token) return
    setSaving(true)
    try {
      const results = await Promise.all(
        Object.values(localConfig).map(config =>
          availabilityService.upsert(token, {
            dayOfWeek: config.dayOfWeek,
            shift: config.shift,
            startTime: config.startTime,
            endTime: config.endTime,
            capacity: config.capacity,
            isActive: config.isActive,
          })
        )
      )
      setAvailability(prev => {
        const updated = [...prev]
        for (const saved of results) {
          const idx = updated.findIndex(
            a => a.dayOfWeek === saved.dayOfWeek && a.shift === saved.shift
          )
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
    <div className="max-w-3xl mx-auto space-y-5 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurar Agenda</h1>
        <p className="text-gray-500 text-sm">
          Defina os turnos (manhã, tarde, noite) e a capacidade de cada dia
        </p>
      </div>

      <AvailabilityInfoCard />

      {loading ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <Skeleton className="h-56" />
          <Skeleton className="h-72" />
        </>
      ) : (
        <>
          <AvailabilityStats activeDays={activeDays} totalWeekCapacity={totalWeekCap} />

          <AvailabilityShiftGrid
            getConfig={getConfig}
            isDirty={isDirty}
            selectedDow={selectedDow}
            onSelectDow={setSelectedDow}
            onToggle={toggleShift}
          />

          <AvailabilityDayDetail
            selectedDow={selectedDow}
            onSelectDow={setSelectedDow}
            getConfig={getConfig}
            isDirty={isDirty}
            onToggle={toggleShift}
            onUpdate={updateLocal}
          />
        </>
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
