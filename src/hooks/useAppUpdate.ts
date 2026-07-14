import { useCallback, useEffect, useState } from "react"
import { App as CapacitorApp } from "@capacitor/app"
import { isNativeApp } from "@/lib/native"

/**
 * Base do FRONT (quem serve /app/version.json e /app/latest.apk pelo nginx) — NÃO é a API.
 * No app a origem é http://localhost (WebView), então não dá para derivar da URL: vem por env
 * no build (.env.app). Sem ela o canal de atualização simplesmente não liga.
 */
const UPDATE_BASE = import.meta.env.VITE_APP_UPDATE_URL as string | undefined

/** Última versão que o usuário mandou calar — não perguntamos de novo por ela. */
const DISMISSED_KEY = "climabra.app.update.dismissed"

export interface AppUpdate {
  versionName: string
  versionCode: number
  /** URL absoluta do APK (o manifesto guarda um caminho relativo ao front). */
  apkUrl: string
  notes: string
}

interface Manifest {
  versionCode: number
  versionName: string
  url: string
  notes: string
}

/**
 * Canal de atualização self-hosted (Fase 3.2(a) do PLANO_APP_CAPACITOR.md): compara o
 * `versionCode` do APK instalado com o do `version.json` publicado por `scripts/publish-apk.sh`.
 *
 * Comparamos o versionCode (inteiro, monotônico) e não o versionName ("1.1") — nome é cosmético e
 * não ordena. `App.getInfo().build` é o versionCode do APK instalado.
 *
 * No navegador é no-op: só existe APK no app empacotado.
 */
export function useAppUpdate() {
  const [update, setUpdate] = useState<AppUpdate | null>(null)

  useEffect(() => {
    if (!isNativeApp() || !UPDATE_BASE) return
    let cancelled = false

    const check = async () => {
      try {
        const info = await CapacitorApp.getInfo()
        const installedCode = Number(info.build)
        if (!Number.isFinite(installedCode)) return

        const res = await fetch(`${UPDATE_BASE}/app/version.json`, { cache: "no-store" })
        if (!res.ok) return
        const manifest = (await res.json()) as Manifest

        const dismissed = Number(localStorage.getItem(DISMISSED_KEY) ?? 0)
        const isNewer = manifest.versionCode > installedCode
        const alreadyRefused = manifest.versionCode <= dismissed
        if (cancelled || !isNewer || alreadyRefused) return

        setUpdate({
          versionName: manifest.versionName,
          versionCode: manifest.versionCode,
          apkUrl: `${UPDATE_BASE}${manifest.url}`,
          notes: manifest.notes,
        })
      } catch {
        // Sem rede, sem manifesto ou JSON quebrado: silêncio. Checar atualização é acessório —
        // não pode virar erro na cara do provider que está trabalhando.
      }
    }

    check()
    // Reabrir o app é o gatilho natural de "será que saiu versão nova?" — não fica em polling.
    let listener: { remove: () => void } | undefined
    CapacitorApp.addListener("resume", check).then(h => {
      if (cancelled) h.remove()
      else listener = h
    })

    return () => {
      cancelled = true
      listener?.remove()
    }
  }, [])

  const dismiss = useCallback(() => {
    if (update) localStorage.setItem(DISMISSED_KEY, String(update.versionCode))
    setUpdate(null)
  }, [update])

  return { update, dismiss }
}
