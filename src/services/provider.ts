import axios from 'axios'
import { DEFAULT_URL } from '.'
import type { IProviderResponse } from './auth'

const providerApi = axios.create({
  baseURL: `${DEFAULT_URL}/providers`
})

export interface IProviderUpdateRequest {
  name: string
  phone: string
  companyName?: string | null
}

export interface IConfirmPhoneRequest {
  name: string
  phone: string
  companyName?: string | null
  code: string
}

export const providerService = {
  async update(token: string, id: string, data: IProviderUpdateRequest): Promise<IProviderResponse> {
    const { data: result } = await providerApi.put<IProviderResponse>(`/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return result
  },

  /** Envia o código de confirmação ao WhatsApp informado (prova de posse). */
  async requestPhoneOtp(token: string, phone: string): Promise<{ phoneMasked: string; resendInSeconds: number }> {
    const { data } = await providerApi.post(`/me/phone/otp/request`, { phone }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return data
  },

  /** Valida o código e completa o perfil (nome/empresa + telefone confirmado). */
  async confirmPhone(token: string, data: IConfirmPhoneRequest): Promise<IProviderResponse> {
    const { data: result } = await providerApi.post<IProviderResponse>(`/me/phone/otp/verify`, data, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return result
  },
}
