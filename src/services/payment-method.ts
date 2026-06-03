import axios from "axios"
import { DEFAULT_URL } from "."

// Rotas públicas do portal do cliente (sem auth de cliente — identificado por
// publicToken + clientId na URL, mesmo padrão do clientService).
const api = axios.create({ baseURL: `${DEFAULT_URL}/clients` })

export interface IPaymentMethod {
  id: string
  brand: string
  last4: string
  holderName: string
  isDefault: boolean
  createdAt: string
}

// DTO NEUTRO — não menciona gateway nenhum. O backend tokeniza atrás do port.
export interface ISaveCardRequest {
  holderName: string
  number: string          // só dígitos
  expiryMonth: string     // "MM"
  expiryYear: string      // "AAAA"
  ccv: string
  holderCpfCnpj: string   // CPF do titular (exigido na tokenização)
}

const base = (publicToken: string, clientId: string) =>
  `/providers/${publicToken}/clients/${clientId}/payment-methods`

export const paymentMethodService = {
  async list(publicToken: string, clientId: string): Promise<IPaymentMethod[]> {
    const { data } = await api.get(base(publicToken, clientId))
    return data
  },

  async save(publicToken: string, clientId: string, payload: ISaveCardRequest): Promise<IPaymentMethod> {
    const { data } = await api.post(base(publicToken, clientId), payload)
    return data
  },

  async setDefault(publicToken: string, clientId: string, id: string): Promise<IPaymentMethod> {
    const { data } = await api.put(`${base(publicToken, clientId)}/${id}/default`)
    return data
  },

  async remove(publicToken: string, clientId: string, id: string): Promise<void> {
    await api.delete(`${base(publicToken, clientId)}/${id}`)
  },
}
