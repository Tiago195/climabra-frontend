export type EquipmentType = "split" | "janela" | "cassete" | "piso_teto" | "central" | "portatil"

export type AppointmentStatus = "scheduled" | "completed" | "canceled" | "no_show"

export type ReportStatus = "draft" | "sent" | "awaiting_payment" | "approved" | "awaiting_execution" | "completed"

export type VisitType = "standard" | "assessment" | "execution"

export type ProviderStatus = "pending" | "blocked" | "active" | "canceled"

export type Shift = "morning" | "afternoon" | "night"

export type GatewayAccountStatus = "none" | "pending" | "approved" | "rejected"

export type PaymentMethod = "pix" | "credit" | "debit" | "cash" | "boleto"
