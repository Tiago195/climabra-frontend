import { useNavigate } from "react-router-dom"
import { AirVent, FileText, FilePlus2, CheckCircle2, Loader2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import type {
  IAppointmentDetailResponse,
  IAppointmentInfo,
  IAppointmentReportInfo,
} from "@/services/appointment"
import type { ReportStatus } from "@/services/enums"
import { EQUIPMENT_TYPE_LABELS } from "@/lib/equipment"

const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  draft: "Rascunho",
  sent: "Aguardando cliente",
  approved: "Aprovado",
  completed: "Concluído",
}

const REPORT_STATUS_COLORS: Record<ReportStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-yellow-100 text-yellow-800",
  approved: "bg-violet-100 text-violet-700",
  completed: "bg-green-100 text-green-700",
}

interface Props {
  row: IAppointmentDetailResponse
  compact?: boolean
  creatingReportFor: string | null
  onCreateReport: (appt: IAppointmentInfo, equipmentId: string) => Promise<void> | void
  onComplete: (appt: IAppointmentInfo, reports: IAppointmentReportInfo[]) => Promise<void> | void
  onCancel: (id: string) => Promise<void> | void
}

/**
 * Bloco de ações para uma visita: laudo por equipamento + botões
 * "Concluir visita" / "Cancelar". Visual adaptado do canvas
 * Solicitações B - Timeline (`EquipmentReportActions`).
 */
export function AppointmentActions({
  row, compact = false, creatingReportFor,
  onCreateReport, onComplete, onCancel,
}: Props) {
  const navigate = useNavigate()
  const { appointment: appt, equipments, reports } = row
  const isScheduled = appt.status === "scheduled"
  const canComplete = reports.length > 0 && reports.every(r => r.status === "completed")
  const completeTitle = reports.length === 0
    ? "Crie um laudo para cada equipamento antes de concluir"
    : !canComplete
      ? "Aguarde todos os laudos serem aprovados pelo cliente"
      : "Concluir visita"

  if (equipments.length === 0) {
    if (!isScheduled) return null
    return (
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => onCancel(appt.id)}
        >
          <XCircle className="w-3.5 h-3.5 mr-1" /> Cancelar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <ul className="space-y-1.5">
        {equipments.map(eq => {
          const eqReport = reports.find(r => r.equipmentId === eq.id)
          const isCreating = creatingReportFor === eq.id
          return (
            <li
              key={eq.id}
              className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2.5 py-1.5"
            >
              <AirVent className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {eq.label || EQUIPMENT_TYPE_LABELS[eq.type] || "Equipamento"}
                </p>
                {!compact && (eq.brand || eq.model) && (
                  <p className="text-[11px] text-gray-400 truncate">
                    {EQUIPMENT_TYPE_LABELS[eq.type]}
                    {(eq.brand || eq.model) && ` · ${[eq.brand, eq.model].filter(Boolean).join(" ")}`}
                  </p>
                )}
              </div>
              {eqReport && (
                <span className={`hidden sm:inline-flex text-[10px] font-medium px-1.5 py-0.5 rounded-full ${REPORT_STATUS_COLORS[eqReport.status]}`}>
                  {REPORT_STATUS_LABELS[eqReport.status]}
                </span>
              )}
              {eqReport ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px] gap-1 px-2 shrink-0"
                  onClick={() => navigate(`/dashboard/reports/${eqReport.id}`)}
                >
                  <FileText className="w-3 h-3" /> Ver laudo
                </Button>
              ) : isScheduled ? (
                <Button
                  size="sm"
                  className="h-7 text-[11px] gap-1 px-2 bg-blue-600 hover:bg-blue-700 shrink-0"
                  onClick={() => onCreateReport(appt, eq.id)}
                  disabled={isCreating}
                >
                  {isCreating
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <FilePlus2 className="w-3 h-3" />}
                  Criar laudo
                </Button>
              ) : null}
            </li>
          )
        })}
      </ul>

      {isScheduled && (
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            onClick={() => onComplete(appt, reports)}
            disabled={!canComplete}
            title={completeTitle}
            className={`flex-1 h-8 gap-1.5 ${canComplete ? "bg-green-600 hover:bg-green-700" : ""}`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Concluir visita
            {!canComplete && (
              <span className="text-[10px] opacity-70">(faltam laudos)</span>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => onCancel(appt.id)}
            title="Cancelar visita"
          >
            <XCircle className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}
