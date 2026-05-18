import { createBrowserRouter } from "react-router-dom"

export const router = createBrowserRouter([
  // {
  //   path: "/",
  //   lazy: () => import("@/pages/landing/LandingPage").then((m) => ({ Component: m.default })),
  // }
  {
    path: "/auth/login",
    lazy: () => import("@/pages/auth/Login").then((m) => ({ Component: m.default })),
  },
  {
    path: "/auth/register",
    lazy: () => import("@/pages/auth/Register").then((m) => ({ Component: m.default })),
  },
  {
    path: "/dashboard",
    lazy: () => import("@/pages/dashboard/Dashboard").then(({Dashboard}) => ({ Component: Dashboard })),
  },
])
