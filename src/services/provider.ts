import { createApi } from '.'
import type { IProviderResponse } from './auth'

const providerApi = createApi("/providers")

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

  /** Atualiza os toggles de cobrança (mão de obra / deslocamento). */
  async updateConfig(
    token: string,
    data: { chargesLabor: boolean; chargesTravel: boolean },
  ): Promise<IProviderResponse> {
    const { data: result } = await providerApi.put<IProviderResponse>(`/me/config`, data, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return result
  },

  /** Salva a tarifa de deslocamento (por km) e geocoda a base. */
  async updateTravelConfig(
    token: string,
    data: {
      travelOriginCep: string
      travelPricePerKmCents: number
      travelFreeRadiusKm: number
      travelMinCents: number
      travelCapCents: number | null
      travelRoundTrip: boolean
    },
  ): Promise<IProviderResponse> {
    const { data: result } = await providerApi.put<IProviderResponse>(`/me/travel-config`, data, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return result
  },

  /** Estima a taxa de deslocamento até um cliente. */
  async getTravelEstimate(
    token: string,
    clientId: string,
  ): Promise<{ distanceKm: number | null; suggestedCents: number | null; available: boolean }> {
    const { data } = await providerApi.get(`/me/travel-estimate`, {
      params: { clientId },
      headers: { Authorization: `Bearer ${token}` },
    })
    return data
  },

  /** Plano de rota do dia (ordem ótima + ETA + geometria). `date` = "YYYY-MM-DD". */
  async getRoute(token: string, date: string): Promise<IRoutePlanResponse> {
    const { data } = await providerApi.get(`/me/route`, {
      params: { date },
      headers: { Authorization: `Bearer ${token}` },
    })
    return data
  },
}

export interface IRouteStop {
  appointmentId: string
  clientId: string
  clientName: string
  shift: string | null
  lat: number
  lng: number
  /** Minutos acumulados desde a base até chegar nesta parada. */
  cumulativeMin: number
}

export interface IRoutePlanResponse {
  date: string
  origin: { lat: number | null; lng: number | null }
  orderedStops: IRouteStop[]
  legDurationMin: number[]
  legDistanceKm: number[]
  totalMin: number
  totalKm: number
  /** Polyline da rota real (cada ponto [lat, lng]); vazia no fallback. */
  geometry: [number, number][]
  /** true = OSRM (rota real); false = fallback Haversine (estimativa). */
  optimized: boolean
  roundTrip: boolean
}
