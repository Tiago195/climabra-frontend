import axios from 'axios'
import { DEFAULT_URL } from '.'
import type { ProviderStatus } from './enums'

const auth = axios.create({
  baseURL: `${DEFAULT_URL}/providers`
}) 

export const authService = {
  async save(request: IAuthRequest) {
    const { data } = await auth.post<IProviderResponse>("", request)

    return data
  },
  async login(request: IAuthRequest) {
    const { data } = await auth.post<IProviderLoginResponse>("/login", request)

    return data
  }
}

export interface IAuthRequest {
  email: string
  password: string
}

export interface IProviderResponse {
  id: string
  email: string
  name: string
  phone: string
  companyName: string
  status: ProviderStatus
  publicToken: string
  createdAt: string
  updatedAt: string
}

export interface IProviderLoginResponse {
  provider: IProviderResponse
  token: string
}