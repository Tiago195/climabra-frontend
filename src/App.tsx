import { RouterProvider } from "react-router-dom"
import { router } from "@/routes"
import { AuthProvider } from "./contexts/authContext"
import { Toaster } from "sonner"
import { useIsMobile } from "@/hooks/useIsMobile"

export function App() {
  const isMobile = useIsMobile()

  return <AuthProvider>
    <RouterProvider router={router} />
    {/* No mobile os toasts sobem acima do bottom nav fixo (4rem + safe-area, ver Layout.tsx) */}
    <Toaster
      offset={isMobile ? { bottom: "calc(4rem + env(safe-area-inset-bottom) + 8px)" } : undefined}
      mobileOffset={isMobile ? { bottom: "calc(4rem + env(safe-area-inset-bottom) + 8px)" } : undefined}
    />
  </AuthProvider>
}

export default App
