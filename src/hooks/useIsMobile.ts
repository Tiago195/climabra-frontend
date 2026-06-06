import { useMediaQuery } from "@/hooks/useMediaQuery"

/** True em telas mobile (< md, 768px). Conveniência sobre `useMediaQuery`. */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)")
}
