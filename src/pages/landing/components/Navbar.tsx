import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Snowflake } from "lucide-react"

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center">
            <Snowflake className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg">ClimaGestão</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/auth/login">
            <Button variant="ghost" size="sm" className="text-gray-700">Entrar</Button>
          </Link>
          <Link to="/auth/register">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Teste grátis</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
