/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/authContext";
import { Link, useNavigate } from "react-router-dom";
import { providerService } from "@/services/auth";
import { Loader2, Wind } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  // const [resetting, setResetting] = useState(false);

  // const handleReset = async () => {
  //   if (!confirm("Isso vai APAGAR todos os dados e recriar o banco com dados de teste. Continuar?")) return;
  //   setResetting(true);
  //   try {
  //     const res = await api.post<any>("/dev/reset", {});
  //     setEmail(res.credentials.email);
  //     setPassword(res.credentials.password);
  //     toast.success('Banco resetado!', { description: `Login: ${res.credentials.email} / ${res.credentials.password}` });
  //   } catch (err: any) {
  //     toast.error(err.message ?? "Erro ao resetar banco");
  //   } finally {
  //     setResetting(false);
  //   }
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha todos os campos")
      return;
    }
    setLoading(true);
    try {
      const data = await providerService.login({ email, password });
      login(data.provider, data.token);
      toast.success(`Bem-vindo, ${data.provider.name ?? data.provider.email}!`);
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message ?? "Email ou senha incorretos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white mb-2 shadow-lg">
            <Wind className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">ClimaGestão</h1>
          <p className="text-gray-500">Gestão inteligente para prestadores de serviço</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Entrar</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label>Senha</Label>
                <Input
                  type="password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" size="lg" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-500">
          Ainda não tem conta?{" "}
          <Link to="/auth/register" className="text-blue-600 font-medium hover:underline">
            Cadastre-se
          </Link>
        </p>

        <div className="border-t pt-4">
          {/* <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full text-orange-700 border-orange-300 hover:bg-orange-50"
            onClick={handleReset}
            disabled={resetting}
          >
            {resetting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
            Resetar banco e recriar dados de teste (dev)
          </Button> */}
          <p className="text-center text-xs text-gray-400 mt-2">
            Login de teste: joao@teste.com / 123456
          </p>
        </div>
      </div>
    </div>
  );
}
