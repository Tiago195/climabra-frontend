import { useEffect } from "react"
import type { PluginListenerHandle } from "@capacitor/core"
import { App as CapacitorApp } from "@capacitor/app"
import { SplashScreen } from "@capacitor/splash-screen"
import { StatusBar, Style } from "@capacitor/status-bar"
import { toast } from "sonner"
import { isNativeApp } from "@/lib/native"

/**
 * Telas "raiz" do app: só delas o VOLTAR pode sair do app (e mesmo assim, com dois toques).
 * De qualquer outra tela, voltar SEMPRE navega para trás — nunca fecha.
 */
const ROOT_PATHS = new Set(["/", "/dashboard", "/auth/login"])

/** Janela do "toque de novo para sair" (padrão Android). */
const EXIT_WINDOW_MS = 2000

/**
 * Ajustes de shell que só existem no app empacotado (Capacitor) — no navegador é no-op.
 * Ver Fase 1.5 do PLANO_APP_CAPACITOR.md.
 */
export function useNativeShell() {
  useEffect(() => {
    if (!isNativeApp()) return

    // overlay:false = a WebView NÃO desenha por baixo da status bar. Sem isto, o Android 15+
    // força edge-to-edge para quem tem targetSdk 35+ e o header do app fica cortado atrás do
    // relógio/bateria (bug reportado no aparelho, 13/07). O CSS ainda respeita
    // env(safe-area-inset-top) (viewport-fit=cover no index.html) como cinto e suspensório:
    // com overlay:false o inset é 0 e nada muda; se algum aparelho ignorar, o padding salva.
    StatusBar.setOverlaysWebView({ overlay: false })
    StatusBar.setStyle({ style: Style.Light }) // fundo claro + ícones escuros, como o header
    StatusBar.setBackgroundColor({ color: "#ffffff" })

    // launchAutoHide=false no capacitor.config: a splash some quando o React já pintou,
    // e não num timeout — assim não existe o flash de tela branca entre uma coisa e outra.
    SplashScreen.hide()

    let lastBackAt = 0
    let listener: PluginListenerHandle | undefined

    CapacitorApp.addListener("backButton", () => {
      // Duas armadilhas aqui, ambas medidas no emulador (13/07) — não "simplifique" de volta:
      //  1. o `canGoBack` do evento vem SEMPRE false: as navegações do react-router são
      //     pushState e não entram no histórico NATIVO da WebView. Quem sabe a profundidade é o
      //     react-router, que grava um `idx` em history.state (0 = primeira entrada);
      //  2. `router.navigate(-1)` (o objeto do createBrowserRouter) não navega daqui, de fora
      //     do React. `history.back()` navega — o RouterProvider escuta o popstate.
      const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
      const path = window.location.pathname
      const atRoot = ROOT_PATHS.has(path)

      if (!atRoot) {
        // Fora da raiz o voltar NUNCA fecha o app. Se não há histórico (idx 0 — acontece quando
        // a tela veio de um reload/deep link), cai para o dashboard em vez de minimizar: era o
        // que fazia o app "fechar do nada" ao voltar (bug reportado no aparelho, 13/07).
        if (idx > 0) window.history.back()
        else window.location.assign("/dashboard")
        return
      }

      // Na raiz: sair exige DOIS toques dentro da janela — o padrão do Android. Um toque
      // acidental não mata mais a sessão do provider no meio do serviço.
      const now = Date.now()
      if (now - lastBackAt < EXIT_WINDOW_MS) {
        CapacitorApp.minimizeApp()
        return
      }
      lastBackAt = now
      toast("Toque em voltar novamente para sair")
    }).then((handle) => {
      listener = handle
    })

    return () => {
      listener?.remove()
    }
  }, [])
}
