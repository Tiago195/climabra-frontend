import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Centavos → "R$ 1.234,56". */
export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

/** Delta % entre dois valores (base 0 → 100% se atual > 0, senão 0). */
export function deltaPercent(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

/**
 * Intervalo [start, end) em ISO date-time local para um período nomeado.
 * `current` = mês corrente; `previous` = mês anterior.
 */
export function monthRange(period: "current" | "previous"): { start: string; end: string } {
  const now = new Date()
  const offset = period === "previous" ? -1 : 0
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1, 0, 0, 0)
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1, 0, 0, 0)
  const toLocalIso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T00:00:00`
  return { start: toLocalIso(start), end: toLocalIso(end) }
}

/**
 * Intervalo [start, end) em ISO date-time local a partir de duas datas
 * `"YYYY-MM-DD"` (inputs nativos de data). `end` é exclusivo — soma 1 dia à
 * data final para incluir o dia inteiro selecionado.
 */
export function customDateRange(startDate: string, endDate: string): { start: string; end: string } {
  const [sy, sm, sd] = startDate.split("-").map(Number)
  const [ey, em, ed] = endDate.split("-").map(Number)
  const start = new Date(sy, sm - 1, sd, 0, 0, 0)
  const end = new Date(ey, em - 1, ed + 1, 0, 0, 0) // +1 dia — fim exclusivo
  const toLocalIso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T00:00:00`
  return { start: toLocalIso(start), end: toLocalIso(end) }
}

/** Dispara o download de um Blob no browser com o nome de arquivo dado. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function formatPhone(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11)
  if (d.length === 0) return ""
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/** Data relativa curta em pt-BR: "agora", "há 5 min", "há 3 h", "há 2 d", ou dd/mm/aaaa se > 30 dias. */
export function formatRelative(iso?: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ""
  const diffMs = Date.now() - d.getTime()
  const diffMin = Math.round(diffMs / 60_000)
  if (diffMin < 1) return "agora"
  if (diffMin < 60) return `há ${diffMin} min`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `há ${diffH} h`
  const diffD = Math.round(diffH / 24)
  if (diffD < 30) return `há ${diffD} d`
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export async function fileToCompressedDataUrl(file: File, maxSize = 1280, quality = 0.75): Promise<string> {
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = dataUrl;
  });

  let { width, height } = img;
  if (width > maxSize || height > maxSize) {
    if (width >= height) {
      height = Math.round((height * maxSize) / width);
      width = maxSize;
    } else {
      width = Math.round((width * maxSize) / height);
      height = maxSize;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}
