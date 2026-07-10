import { createApi } from '.'
import type { GatewayAccountStatus, PaymentMethod, ProviderStatus } from './enums'

const auth = createApi("/providers")

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
  cpfCnpj?: string | null
  gatewayAccountStatus: GatewayAccountStatus
  acceptedPaymentMethods: PaymentMethod[]
  // Toggles de cobrança (provider_config)
  chargesLabor: boolean
  chargesTravel: boolean
  travel: ITravelConfig | null
  createdAt: string
  updatedAt: string
}

export interface ITravelConfig {
  originCep: string | null
  pricePerKmCents: number | null
  freeRadiusKm: number | null
  minCents: number | null
  capCents: number | null
  roundTrip: boolean
  originGeocoded: boolean
}

export interface IProviderLoginResponse {
  provider: IProviderResponse
  token: string
}