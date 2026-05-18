import { RouterProvider } from "react-router-dom"
import { router } from "@/routes"
import { AuthProvider } from "./contexts/authContext"
import { Toaster } from "sonner"

export function App() {
  return <AuthProvider>
    <RouterProvider router={router} />
    <Toaster />
  </AuthProvider>
}

export default App
