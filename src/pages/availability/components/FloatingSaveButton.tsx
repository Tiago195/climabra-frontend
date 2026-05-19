import { Button } from "@/components/ui/button"
import { Save, Loader2 } from "lucide-react"

interface FloatingSaveButtonProps {
  saving: boolean
  onClick: () => void
}

export function FloatingSaveButton({ saving, onClick }: FloatingSaveButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={saving}
      className="fixed bottom-6 right-6 z-50 gap-2 bg-blue-600 hover:bg-blue-700 shadow-xl px-6"
      size="lg"
    >
      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
      Salvar alterações
    </Button>
  )
}
