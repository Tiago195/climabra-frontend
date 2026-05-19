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

export const clientService = {
  async list(token: string): Promise<IClientResponse[]> {
    const { data } = await api.get("", authHeader(token))
    return data
  },

  async create(token: string, payload: IClientCreateRequest): Promise<IClientResponse> {
    const { data } = await api.post("", payload, authHeader(token))
    return data
  },
}
