import { Snowflake } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-white py-8 px-5">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center">
            <Snowflake className="w-3 h-3 text-white" />
          </div>
          <span className="font-semibold text-gray-700">ClimaGestão</span>
        </div>
        <p>© {new Date().getFullYear()} ClimaGestão. Todos os direitos reservados.</p>
      </div>
    </footer>
  )
}
