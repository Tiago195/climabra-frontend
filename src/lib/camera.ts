import { Camera, CameraResultType, CameraSource } from "@capacitor/camera"
import { isNativeApp } from "./native"

/**
 * Câmera e compressão de imagem — a origem das FOTOS do app (laudo antes/depois, fotos de
 * cliente). São DUAS responsabilidades atrás de funções separadas, uma nativa e uma
 * web-agnóstica (Fase 2.3 do PLANO_APP_CAPACITOR.md):
 *
 * - **`captureFromCamera()`** — SÓ no app: abre a câmera nativa (`@capacitor/camera`) com preview
 *   e devolve um `File` já redimensionado/comprimido pelo plugin. No navegador devolve `null` — o
 *   chamador cai no `<input type="file" capture>` de sempre. Também devolve `null` se o usuário
 *   cancelar (o plugin rejeita nesse caso, e cancelar NÃO é erro).
 *
 * - **`compressImage(file)`** — em QUALQUER plataforma: reduz a imagem antes do upload. Até aqui
 *   as fotos subiam no tamanho original (celular moderno = 3–8 MB por foto). É **idempotente e
 *   defensiva**: imagem já pequena passa intacta, não-imagem passa intacta, e QUALQUER falha
 *   devolve o arquivo original — a compressão jamais bloqueia o upload.
 *
 * Por que as duas convivem: no app o `captureFromCamera` já entrega comprimido, mas fotos que
 * chegam pela galeria (input `multiple`) ou pelo drag-and-drop no navegador continuam grandes —
 * é `compressImage` quem as reduz. Rotear o resultado do plugin por `compressImage` de novo é
 * seguro: ele já vem pequeno e o guard abaixo o deixa passar intacto.
 */

/** Lado maior da imagem final, em px. Suficiente para o laudo; derruba fotos de 4000px+. */
const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.8
/**
 * Abaixo deste tamanho a imagem passa intacta por `compressImage`: já está leve o bastante e
 * recomprimir só degradaria qualidade sem ganho. É também o que torna a função idempotente para
 * o `File` que o plugin nativo já devolveu comprimido (evita recompressão dupla).
 */
const SKIP_BELOW_BYTES = 700 * 1024

/**
 * Abre a câmera NATIVA (app) e devolve a foto como `File` já comprimido pelo plugin.
 * No navegador devolve `null` de propósito — quem chama deve cair no `<input capture>`.
 * Devolve `null` também quando o usuário cancela a câmera.
 */
export async function captureFromCamera(): Promise<File | null> {
  if (!isNativeApp()) return null
  try {
    const photo = await Camera.getPhoto({
      source: CameraSource.Camera,
      resultType: CameraResultType.Uri,
      quality: 80,
      width: MAX_DIMENSION, // o próprio plugin redimensiona/comprime na captura
      correctOrientation: true,
      saveToGallery: false,
    })
    if (!photo.webPath) return null
    const blob = await (await fetch(photo.webPath)).blob()
    const format = photo.format || "jpeg"
    return new File([blob], `foto-${Date.now()}.${format}`, {
      type: blob.type || `image/${format}`,
    })
  } catch {
    // O plugin rejeita quando o usuário fecha a câmera sem tirar foto. Isso não é erro —
    // o chamador só não recebe arquivo nenhum.
    return null
  }
}

/**
 * Reduz uma imagem antes do upload (redimensiona para no máx. {@link MAX_DIMENSION}px no lado
 * maior e reencoda em JPEG). Preserva a orientação do EXIF (`imageOrientation: "from-image"`),
 * senão fotos de celular subiriam deitadas.
 *
 * Devolve o arquivo ORIGINAL, sem lançar, quando: não é imagem, é GIF (animação se perderia), já
 * está pequeno, o canvas não está disponível, ou o resultado ficaria maior que o original. Nunca
 * bloqueia o upload.
 */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file
  if (file.size <= SKIP_BELOW_BYTES) return file

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      bitmap.close()
      return file
    }
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    )
    // Se não comprimiu ou piorou (imagem já otimizada), fica com o original.
    if (!blob || blob.size >= file.size) return file

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg"
    return new File([blob], name, { type: "image/jpeg" })
  } catch {
    return file
  }
}
