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

export const providerService = {
  async update(token: string, id: string, data: IProviderUpdateRequest): Promise<IProviderResponse> {
    const { data: result } = await providerApi.put<IProviderResponse>(`/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return result
  }
}
