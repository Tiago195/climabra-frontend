import { ArrowDownToLine, X } from "lucide-react"
import { useAppUpdate } from "@/hooks/useAppUpdate"

/**
 * Banner "nova versão disponível" do app (Fase 3.2(a) do PLANO_APP_CAPACITOR.md).
 *
 * Sem loja não existe atualização automática: o APK é sideload, então é o app que avisa. Tocar em
 * "Atualizar" abre o APK no NAVEGADOR do sistema (`target="_blank"` — a WebView do Capacitor manda
 * links assim para fora), o Android baixa e oferece instalar. Instalar por cima preserva os dados
 * (mesma assinatura), então a sessão do provider sobrevive.
 *
 * No navegador o hook devolve `null` e isto não renderiza nada.
 */
export function AppUpdateBanner() {
  const { update, dismiss } = useAppUpdate()

  if (!update) return null

  return (
    <div className="fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)] bg-blue-600 text-white shadow-md">
      <div className="flex items-center gap-3 px-4 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Nova versão disponível ({update.versionName})</p>
          {update.notes && (
            <p className="truncate text-xs text-blue-100">{update.notes}</p>
          )}
        </div>

        <a
          href={update.apkUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 active:bg-blue-50"
        >
          <ArrowDownToLine className="h-4 w-4" />
          Atualizar
        </a>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dispensar atualização"
          className="shrink-0 rounded-lg p-1.5 text-blue-100 active:bg-blue-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
