import axios from "axios"
import { DEFAULT_URL } from "."

export const uploadService = {
  async upload(token: string, file: File): Promise<string> {
    const formData = new FormData()
    formData.append("file", file)
    const { data } = await axios.post(`${DEFAULT_URL}/uploads`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    })
    return data.url as string
  },

  async uploadPublic(file: File): Promise<string> {
    const formData = new FormData()
    formData.append("file", file)
    const { data } = await axios.post(`${DEFAULT_URL}/uploads/public`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return data.url as string
  },
}
