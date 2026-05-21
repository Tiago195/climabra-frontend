import axios from "axios"
import { DEFAULT_URL } from "."

const api = axios.create({ baseURL: `${DEFAULT_URL}/clients` })

const authHeader = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } })

export interface IClientResponse {
  id: string
  name: string
  email: string
  phone: string
  cep: string
  street: string
  streetNumber: number
  complement?: string
  neighborhood: string
  city: string
  state: string
  createdAt: string
  updatedAt: string
}

export interface IClientCreateRequest {
  name: string
  email: string
  phone: string
  cep: string
  street: string
  streetNumber: number
  complement?: string
  neighborhood: string
  city: string
  state: string
}

export interface IEquipmentResponse {
  id: string
  clientId: string
  type: string
  brand: string
  model: string
  label: string
  createdAt: string
}

export interface IClientDetailResponse {
  client: IClientResponse
  equipments: IEquipmentResponse[]
}

export interface ISignUpSubmitRequest {
  name: string
  phone: string
  email: string
  cep: string
  street: string
  streetNumber: number
  complement?: string
  neighborhood: string
  city: string
  state: string
  description: string
  photoUrls: string[]
  equipmentType: string
  equipmentBrand?: string
  equipmentModel?: string
  equipmentLabel?: string
  problemType?: string
  scheduledAt: string
}

export interface IPortalEquipment {
  id: string
  type: string
  brand: string
  model: string
  label: string
}

export interface IPortalAppointment {
  id: string
  scheduledAt: string
  status: string
  equipmentId: string | null
  notes: string | null
}

export interface IPortalSubmission {
  id: string
  description: string
  photoUrls: string[]
  equipmentId: string | null
  createdAt: string
}

export interface IPortalReport {
  id: string
  title: string | null
  status: string
  publicToken: string
  equipmentId: string
  createdAt: string
}

export interface IClientPortalResponse {
  client: { id: string; name: string; email: string; phone: string }
  provider: { name: string; companyName: string | null; phone: string | null; email: string }
  equipments: IPortalEquipment[]
  appointments: IPortalAppointment[]
  submissions: IPortalSubmission[]
  reports: IPortalReport[]
}

export interface IAppointmentRequestPayload {
  equipmentId?: string
  equipmentType?: string
  equipmentBrand?: string
  equipmentModel?: string
  equipmentLabel?: string
  description: string
  photoUrls: string[]
  problemType?: string
  scheduledAt: string
}

export const clientService = {
  async list(token: string): Promise<IClientResponse[]> {
    const { data } = await api.get("", authHeader(token))
    return data
  },

  async findById(token: string, id: string): Promise<IClientDetailResponse> {
    const { data } = await api.get(`/${id}`, authHeader(token))
    return data
  },

  async create(token: string, payload: IClientCreateRequest): Promise<IClientResponse> {
    const { data } = await api.post("", payload, authHeader(token))
    return data
  },

  async signUpSubmit(publicToken: string, payload: ISignUpSubmitRequest): Promise<void> {
    await api.post(`/public/${publicToken}`, payload)
  },

  async getPortal(publicToken: string, clientId: string): Promise<IClientPortalResponse> {
    const { data } = await api.get(`/providers/${publicToken}/clients/${clientId}`)
    return data
  },

  async requestAppointment(publicToken: string, clientId: string, payload: IAppointmentRequestPayload): Promise<void> {
    await api.post(`/providers/${publicToken}/clients/${clientId}/appointments`, payload)
  },
}
