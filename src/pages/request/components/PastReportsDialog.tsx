import { useNavigate } from "react-router-dom"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { AirVent, FileText, ChevronRight } from "lucide-react"
import type { IAppointmentDetailResponse } from "@/services/appointment"
import type { ReportStatus } from "@/services/enums"
import { EQUIPMENT_TYPE_LABELS } from "@/lib/equipment"
import { formatDateBr } from "@/lib/shifts"

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
  row: IAppointmentDetailResponse | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Modal de seleção: lista equipamentos da visita. Cada equipamento com laudo
 * é clicável e navega para a tela do laudo (`/dashboard/reports/:id`).
 */
export function PastReportsDialog({ row, open, onOpenChange }: Props) {
  const navigate = useNavigate()

  const openReport = (reportId: string) => {
    onOpenChange(false)
    navigate(`/dashboard/reports/${reportId}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" /> Laudos da visita
          </DialogTitle>
          {row && (
            <DialogDescription>
              {row.client.name} · {formatDateBr(row.appointment.scheduledDate)}
            </DialogDescription>
          )}
        </DialogHeader>
        {row && (
          <div className="space-y-1.5">
            {row.equipments.map(eq => {
              const r = row.reports.find(rp => rp.equipmentId === eq.id)
              const eqLabel = eq.label || EQUIPMENT_TYPE_LABELS[eq.type] || "Equipamento"
              const subtitle = [EQUIPMENT_TYPE_LABELS[eq.type], eq.brand]
                .filter(Boolean)
                .join(" · ")
              const content = (
                <>
                  <AirVent className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-[12px] font-semibold text-gray-800 truncate">{eqLabel}</p>
                    {subtitle && (
                      <p className="text-[10px] text-gray-400 truncate">{subtitle}</p>
                    )}
                  </div>
                  {r ? (
                    <>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${REPORT_STATUS_COLORS[r.status]}`}>
                        {REPORT_STATUS_LABELS[r.status]}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    </>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-gray-200 text-gray-500">
                      sem laudo
                    </span>
                  )}
                </>
              )
              return r ? (
                <button
                  key={eq.id}
                  type="button"
                  onClick={() => openReport(r.id)}
                  className="w-full flex items-center gap-2 bg-gray-50 hover:bg-blue-50 hover:ring-1 hover:ring-blue-200 rounded-md px-2 py-1.5 transition-colors"
                >
                  {content}
                </button>
              ) : (
                <div
                  key={eq.id}
                  className="flex items-center gap-2 bg-gray-50 rounded-md px-2 py-1.5"
                >
                  {content}
                </div>
              )
            })}
            {row.equipments.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">
                Visita sem equipamentos vinculados.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
