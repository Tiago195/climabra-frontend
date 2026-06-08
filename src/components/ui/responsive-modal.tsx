import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/useIsMobile"
import { cn } from "@/lib/utils"

/** Largura do diálogo no desktop. `!` vence o `sm:max-w-sm` padrão do DialogContent. */
const DESKTOP_WIDTH = {
  sm: "sm:max-w-sm!",
  md: "sm:max-w-md!",
  lg: "sm:max-w-lg!",
  xl: "sm:max-w-2xl!",
  "2xl": "sm:max-w-3xl!",
} as const

interface ResponsiveModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  /** Largura no desktop (default "md"). No mobile o sheet é sempre full-width. */
  size?: keyof typeof DESKTOP_WIDTH
  /** Classes extras no container do desktop (DialogContent). */
  className?: string
}

/**
 * Modal responsivo, mobile-first: `Sheet` (bottom) no mobile (< md) e `Dialog`
 * centralizado no desktop (≥ md). Mesma API nos dois — `open`/`onOpenChange`.
 * Padrão único de modal do projeto — preferir a `Dialog`/`Sheet` cru.
 */
export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = "md",
  className,
}: ResponsiveModalProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl px-4 pt-3 pb-8 max-h-[92dvh] overflow-y-auto text-sm"
        >
          <SheetHeader className="px-0 text-left">
            <SheetTitle>{title}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
          {children}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-h-[85vh] overflow-y-auto", DESKTOP_WIDTH[size], className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}
