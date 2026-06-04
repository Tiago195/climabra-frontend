import axios from "axios"
import { DEFAULT_URL } from "."
import type { PaymentMethod } from "./report"

// Rotas públicas do portal do laudo (cadeia de tokens na URL, sem auth de
// cliente — mesmo modelo do reportService público). DTO neutro: não menciona
// gateway nenhum.
const api = axios.create({ baseURL: `${DEFAULT_URL}/reports/public` })

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
    const { data } = await api.post(`${base(pt, cid, eid, rt)}/checkout`, body)
    return data
  },

  async getStatus(pt: string, cid: string, eid: string, rt: string): Promise<IPaymentStatusResponse> {
    const { data } = await api.get(`${base(pt, cid, eid, rt)}/payment`)
    return data
  },
}
