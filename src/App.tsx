import { RouterProvider } from "react-router-dom"
import { router } from "@/routes"
import { AuthProvider } from "./contexts/authContext"
import { Toaster } from "sonner"
import { useIsMobile } from "@/hooks/useIsMobile"
import { useNativeShell } from "@/hooks/useNativeShell"
import { AppUpdateBanner } from "@/components/AppUpdateBanner"

export function App() {
  const isMobile = useIsMobile()
  useNativeShell() // back button / status bar / splash — no-op no navegador

  return <AuthProvider>
    {/* canal de atualização do APK sideload — no-op no navegador */}
    <AppUpdateBanner />
    <RouterProvider router={router} />
    {/* No mobile os toasts sobem acima do bottom nav fixo (4rem + safe-area, ver Layout.tsx) */}
    <Toaster
      offset={isMobile ? { bottom: "calc(4rem + env(safe-area-inset-bottom) + 8px)" } : undefined}
      mobileOffset={isMobile ? { bottom: "calc(4rem + env(safe-area-inset-bottom) + 8px)" } : undefined}
    />
  </AuthProvider>
}

export default App
