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
  },
  {
    path: "/mockup/client-portal-neu-v1",
    lazy: () => import("@/pages/mockup/ClientPortalNeuV1").then(m => ({ Component: m.default })),
  },
  {
    path: "/mockup/client-portal-neu-v2",
    lazy: () => import("@/pages/mockup/ClientPortalNeuV2").then(m => ({ Component: m.default })),
  },
  {
    path: "/mockup/client-portal-neu-v3",
    lazy: () => import("@/pages/mockup/ClientPortalNeuV3").then(m => ({ Component: m.default })),
  },
  {
    path: "/mockup/availability-exceptions-v1",
    lazy: () => import("@/pages/mockup/availability/ExceptionsV1Calendar").then(m => ({ Component: m.default })),
  },
  {
    path: "/mockup/availability-exceptions-v2",
    lazy: () => import("@/pages/mockup/availability/ExceptionsV2List").then(m => ({ Component: m.default })),
  },
  {
    path: "/mockup/availability-exceptions-v3",
    lazy: () => import("@/pages/mockup/availability/ExceptionsV3Timeline").then(m => ({ Component: m.default })),
  },
  {
    path: "/mockup/exceptions-calendar",
    lazy: () => import("@/pages/mockup/exceptions/ExceptionsCalendarCard").then(m => ({ Component: m.default })),
  },
  {
    path: "/mockup/exceptions-dialog",
    lazy: () => import("@/pages/mockup/exceptions/AddExceptionDialog").then(m => ({ Component: m.default })),
  },
  {
    path: "/mockup/exceptions-list",
    lazy: () => import("@/pages/mockup/exceptions/ExceptionsList").then(m => ({ Component: m.default })),
  },
  {
    path: "/mockup/agenda/requests-calendar",
    lazy: () => import("@/pages/mockup/agenda-turnos/RequestsCalendar").then(m => ({ Component: m.default })),
  },
  {
    path: "/mockup/agenda/requests-timeline",
    lazy: () => import("@/pages/mockup/agenda-turnos/RequestsTimeline").then(m => ({ Component: m.default })),
  },
  {
    path: "/mockup/agenda/new-calendar",
    lazy: () => import("@/pages/mockup/agenda-turnos/NewRequestCalendar").then(m => ({ Component: m.default })),
  },
  {
    path: "/mockup/agenda/new-timeline",
    lazy: () => import("@/pages/mockup/agenda-turnos/NewRequestTimeline").then(m => ({ Component: m.default })),
  },
  {
    path: "/mockup/agenda/availability-grid",
    lazy: () => import("@/pages/mockup/agenda-turnos/AvailabilityGrid").then(m => ({ Component: m.default })),
  },
  {
    path: "/mockup/agenda/availability-timeline",
    lazy: () => import("@/pages/mockup/agenda-turnos/AvailabilityTimeline").then(m => ({ Component: m.default })),
  },
  {
    path: "/mockup/agenda/portal-calendar",
    lazy: () => import("@/pages/mockup/agenda-turnos/ClientPortalCalendar").then(m => ({ Component: m.default })),
  },
  {
    path: "/mockup/agenda/portal-timeline",
    lazy: () => import("@/pages/mockup/agenda-turnos/ClientPortalTimeline").then(m => ({ Component: m.default })),
  },
  {
    path: "/mockup/rastreio/health",
    lazy: () => import("@/pages/mockup/rastreio-equipamentos/HealthGrid").then(m => ({ Component: m.default })),
  },
  {
    path: "/mockup/rastreio/timeline",
    lazy: () => import("@/pages/mockup/rastreio-equipamentos/MaintenanceTimeline").then(m => ({ Component: m.default })),
  },
  {
    path: "/mockup/rastreio/reminders",
    lazy: () => import("@/pages/mockup/rastreio-equipamentos/ReminderSettings").then(m => ({ Component: m.default })),
  },
  {
    path: "/mockup/rastreio/portal-alerts",
    lazy: () => import("@/pages/mockup/rastreio-equipamentos/ClientReminderPortal").then(m => ({ Component: m.default })),
  },
])
