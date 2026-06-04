import axios from "axios"
import { DEFAULT_URL } from "."
import type { GatewayAccountStatus, PaymentMethod } from "./enums"

const paymentApi = axios.create({ baseURL: `${DEFAULT_URL}/providers` })

const authHeader = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } })

export interface IPaymentSettings {
  hasGatewayAccount: boolean
  gatewayAccountStatus: GatewayAccountStatus
  pixEnabled: boolean   // PIX só após aprovação total da subconta + chave ativa
  acceptedPaymentMethods: PaymentMethod[]
}

export type CompanyType = "MEI" | "LIMITED" | "INDIVIDUAL" | "ASSOCIATION"

export interface IConnectPaymentsRequest {
  cpfCnpj: string
  birthDate?: string // ISO yyyy-MM-dd; obrigatório se CPF
  companyType?: CompanyType // obrigatório se CNPJ
  incomeValueCents: number
  postalCode: string
  address: string
  addressNumber: string
  province: string
}

export const paymentService = {
  async connect(token: string, data: IConnectPaymentsRequest): Promise<IPaymentSettings> {
    const { data: result } = await paymentApi.post<IPaymentSettings>(
      "/me/payments/connect", data, authHeader(token)
    )
    return result
  },

  async updateMethods(token: string, methods: PaymentMethod[]): Promise<IPaymentSettings> {
    const { data: result } = await paymentApi.put<IPaymentSettings>(
      "/me/payments/methods", { methods }, authHeader(token)
    )
    return result
  },

  /** Sincroniza o status real da subconta na Asaas (capacidade de cobrar / PIX). */
  async getStatus(token: string): Promise<IPaymentSettings> {
    const { data: result } = await paymentApi.get<IPaymentSettings>(
      "/me/payments/status", authHeader(token)
    )
    return result
  },
}
