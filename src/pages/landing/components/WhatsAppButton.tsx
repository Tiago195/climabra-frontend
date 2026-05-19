import { MessageCircle } from "lucide-react"

const WHATSAPP = "https://wa.me/5511999990000"

export function WhatsAppButton() {
  return (
    <a
      href={WHATSAPP}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 shadow-2xl flex items-center justify-center text-white transition-transform hover:scale-105"
      aria-label="Falar no WhatsApp"
    >
      <MessageCircle className="w-7 h-7" />
    </a>
  )
}
