import { createApi } from "."
import { clientSession } from "./clientSession"
import type { PaymentMethod } from "./report"

// Checkout do laudo: exige a sessão do cliente (OTP/Q5). O header Authorization é
// injetado a partir do clientSession (token vinculado a clientId+providerToken).
const api = createApi("/reports/public")

export type CheckoutMethod = "pix" | "credit" | "debit" | "cash"

export interface ICheckoutRequest {
  method: CheckoutMethod
  clientPaymentMethodId?: string   // cartão salvo (sem CPF)
  // cartão novo (modelo A — form próprio):
  holderName?: string
  number?: string
  expiryMonth?: string
  expiryYear?: string
  ccv?: string
  holderCpfCnpj?: string           // PIX / cartão novo
  saveCard?: boolean
}

export interface IPixData {
  qrCodePayload: string
  qrCodeImageBase64: string
  expiresAt: string | null
}

export interface ICheckoutResponse {
  status: "pending" | "paid"
  method: PaymentMethod
  amountCents: number
  pix?: IPixData | null
  invoiceUrl?: string | null
}

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded"

export interface IPaymentStatusResponse {
  status: PaymentStatus
}

const base = (pt: string, cid: string, eid: string, rt: string) =>
  `/${pt}/${cid}/${eid}/${rt}`

export const checkoutService = {
  async checkout(
    pt: string, cid: string, eid: string, rt: string,
    body: ICheckoutRequest,
  ): Promise<ICheckoutResponse> {
    const { data } = await api.post(`${base(pt, cid, eid, rt)}/checkout`, body, clientSession.authHeader(cid))
    return data
  },

  async getStatus(pt: string, cid: string, eid: string, rt: string): Promise<IPaymentStatusResponse> {
    const { data } = await api.get(`${base(pt, cid, eid, rt)}/payment`, clientSession.authHeader(cid))
    return data
  },
}
