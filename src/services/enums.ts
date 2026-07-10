export type EquipmentType = "split" | "janela" | "cassete" | "piso_teto" | "central" | "portatil"

export type AppointmentStatus = "scheduled" | "completed" | "canceled" | "no_show"

export type ReportStatus = "draft" | "sent" | "awaiting_payment" | "approved" | "awaiting_execution" | "completed" | "declined"

/** Motivo da perda comercial de um laudo (CRM F2). */
export type DeclinedReason = "price" | "deadline" | "competitor" | "gave_up" | "other"

/** Rótulos em pt-BR do motivo de perda comercial — fonte única (Pipeline + ReportEditor). */
export const DECLINED_REASON_LABEL: Record<DeclinedReason, string> = {
  price: "Preço",
  deadline: "Prazo",
  competitor: "Concorrência",
  gave_up: "Desistiu",
  other: "Outro",
}

export type VisitType = "standard" | "assessment" | "execution"

export type ProviderStatus = "pending" | "blocked" | "active" | "canceled"

export type Shift = "morning" | "afternoon" | "night"

export type GatewayAccountStatus = "none" | "pending" | "approved" | "rejected"

export type PaymentMethod = "pix" | "credit" | "debit" | "cash" | "boleto"

/** Tipo da anotação de cliente (CRM F1). */
export type NoteKind = "note" | "call" | "whatsapp" | "visit_followup"

/** Fonte de um item das Próximas Ações (CRM F4) — extensível (4.3: manutenção, inativos). */
export type NextActionType =
  | "open_submission" | "report_sent" | "report_awaiting_payment" | "note_reminder" | "appointment_today"

/** Urgência ordenável de um item das Próximas Ações — mais urgente primeiro. */
export type NextActionUrgency = "overdue" | "today" | "waiting"

/** Tipo de notificação configurável do provider (CRM F3). O `manual` não é configurável. */
export type NotificationType = "payment_received" | "payment_receipt" | "report_sent" | "visit_reminder"

/** Rótulos/descrições em pt-BR dos tipos de notificação (Settings + templates). */
export const NOTIFICATION_TYPE_META: Record<NotificationType, { label: string; desc: string }> = {
  payment_received: { label: "Pagamento recebido (para você)", desc: "Avisa você quando um cliente paga um laudo." },
  payment_receipt: { label: "Recibo de pagamento (para o cliente)", desc: "Confirma ao cliente que o pagamento foi recebido." },
  report_sent: { label: "Laudo enviado (para o cliente)", desc: "Envia ao cliente o link do laudo quando você o publica." },
  visit_reminder: { label: "Lembrete de visita (para o cliente)", desc: "Lembra o cliente, na véspera, da visita agendada." },
}
