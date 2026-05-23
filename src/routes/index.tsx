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
        path: "/dashboard/clients/:id",
        lazy: () => import("@/pages/clients/ClientDetail").then(({ ClientDetail }) => ({ Component: ClientDetail })),
      },
      {
        path: "/dashboard/requests",
        lazy: () => import("@/pages/request/Requests").then(({ Requests }) => ({ Component: Requests })),
      },
      {
        path: "/dashboard/availability",
        lazy: () => import("@/pages/availability/Availability").then(({ Availability }) => ({ Component: Availability })),
      },
      {
        path: "/dashboard/reports/:id",
        lazy: () => import("@/pages/report/ReportEditor").then(({ ReportEditor }) => ({ Component: ReportEditor })),
      },
    ],
  },
  {
    path: "/providers/:providerToken/clients/:clientId/equipment/:equipmentId/laudo/:reportToken",
    lazy: () => import("@/pages/report/PublicReport").then(({ PublicReport }) => ({ Component: PublicReport })),
  },
  {
    path: "/providers/:publicToken/client",
    lazy: () => import("@/pages/clients/ClientSignUp").then(({ClientSignUp}) => ({ Component: ClientSignUp })),
  },
  {
    path: "/providers/:publicToken/clients/:id",
    lazy: () => import("@/pages/clients/ClientPortal").then(({ClientPortal}) => ({ Component: ClientPortal })),
  },
  {
    path: "/providers/:publicToken/clients/:id/neu",
    lazy: () => import("@/pages/clients/ClientPortalNeu").then(m => ({ Component: m.default })),
  },
  {
    path: "/providers/:publicToken/clients/:id/request",
    lazy: () => import("@/pages/clients/ClientForm").then(m => ({ Component: m.default })),
  },
  {
    path: "/mockup/client-portal-neumorphism",
    lazy: () => import("@/pages/mockup/ClientPortalNeumorphism").then(m => ({ Component: m.default })),
  }
])
