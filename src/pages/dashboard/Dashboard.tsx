import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, CalendarDays, Plus, CheckCircle2, AlertCircle, ArrowRight, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/authContext";
import { useRequireProfile } from "@/components/CompleteProfileDialog";
import { clientService, type IClientResponse } from "@/services/client";
import { appointmentService, type IAppointmentDetailResponse } from "@/services/appointment";
import { compareScheduledShift, isFutureScheduled, formatScheduledShift } from "@/lib/shifts";

export function Dashboard() {
  const { provider, token } = useAuth();
  const navigate = useNavigate();
  const requireProfile = useRequireProfile();

  const [clients, setClients] = useState<IClientResponse[]>([]);
  const [appointments, setAppointments] = useState<IAppointmentDetailResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const isProfileComplete = provider?.status !== "pending";

  useEffect(() => {
    if (!token) return;
    Promise.all([clientService.list(token), appointmentService.list(token)])
      .then(([c, a]) => { setClients(c); setAppointments(a); })
      .finally(() => setLoading(false));
  }, [token]);

  const totalClients = clients.length;
  const scheduled = appointments.filter(a => a.appointment.status === "scheduled").length;
  const completed = appointments.filter(a => a.appointment.status === "completed").length;
  const canceled = appointments.filter(a => a.appointment.status === "canceled").length;

  const now = new Date();
  const upcoming = appointments
    .filter(a =>
      a.appointment.status === "scheduled" &&
      isFutureScheduled(a.appointment.scheduledDate, a.appointment.shift, now)
    )
    .sort((a, b) => compareScheduledShift(a.appointment, b.appointment))
    .slice(0, 5);

  const recentClients = [...clients]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm">Bem-vindo, {provider?.companyName ?? provider?.name}</p>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700 gap-2"
          onClick={() => requireProfile(() => navigate("/dashboard/clients"))}
        >
          <Plus className="w-4 h-4" />
          Novo cliente
        </Button>
      </div>

      {!isProfileComplete && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-900">Finalize seu cadastro</p>
              <p className="text-xs text-amber-800 mt-0.5">
                Adicione seu nome e telefone pra começar a cadastrar clientes e gerar links.
              </p>
            </div>
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
              onClick={() => requireProfile(() => {})}
            >
              Completar
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-500" />
                <p className="text-xs text-gray-500 font-medium">Total Clientes</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{totalClients}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="w-4 h-4 text-blue-500" />
                <p className="text-xs text-gray-500 font-medium">Visitas agendadas</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{scheduled}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <p className="text-xs text-gray-500 font-medium">Concluídas</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{completed}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-gray-400" />
                <p className="text-xs text-gray-500 font-medium">Canceladas</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{canceled}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Próximas visitas</CardTitle>
            <Link to="/dashboard/requests">
              <Button variant="ghost" size="sm" className="text-blue-600 gap-1 text-xs">
                Ver todas <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
            ) : upcoming.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma visita agendada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map(a => (
                  <div key={a.appointment.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{a.client.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatScheduledShift(a.appointment.scheduledDate, a.appointment.shift)}
                      </p>
                    </div>
                    <Badge variant="default" className="bg-blue-100 text-blue-700 text-xs">Agendado</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Clientes recentes</CardTitle>
            <Link to="/dashboard/clients">
              <Button variant="ghost" size="sm" className="text-blue-600 gap-1 text-xs">
                Ver todos <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
            ) : recentClients.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum cliente cadastrado</p>
                <Button
                  size="sm"
                  className="mt-3 bg-blue-600 hover:bg-blue-700"
                  onClick={() => requireProfile(() => navigate("/dashboard/clients"))}
                >
                  <Plus className="w-3 h-3 mr-1" /> Adicionar cliente
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentClients.map(c => (
                  <Link key={c.id} to={`/dashboard/clients/${c.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <div>
                        <p className="font-medium text-sm text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.phone}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
