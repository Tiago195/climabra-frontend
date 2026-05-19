import { createBrowserRouter } from "react-router-dom"
import { Layout } from "@/components/Layout"

export const router = createBrowserRouter([
  {
    path: "/",
    lazy: () => import("@/pages/landing/Landing").then((m) => ({ Component: m.default })),
  },
  {
    path: "/auth/login",
    lazy: () => import("@/pages/auth/Login").then((m) => ({ Component: m.default })),
  },
  {
    path: "/auth/register",
    lazy: () => import("@/pages/auth/Register").then((m) => ({ Component: m.default })),
  },
  {
    Component: Layout,
    children: [
      {
        path: "/dashboard",
        lazy: () => import("@/pages/dashboard/Dashboard").then(({ Dashboard }) => ({ Component: Dashboard })),
      },
      {
        path: "/dashboard/clients",
        lazy: () => import("@/pages/clients/Client").then(({ Client }) => ({ Component: Client })),
      },
      {
        path: "/dashboard/availability",
        lazy: () => import("@/pages/availability/Availability").then(({ Availability }) => ({ Component: Availability })),
      },
    ],
  },
])
