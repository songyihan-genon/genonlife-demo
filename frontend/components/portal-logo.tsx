"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

interface PortalLogoProps {
  compact?: boolean
  className?: string
}

export function PortalLogo({ compact = false, className }: PortalLogoProps) {
  if (compact) {
    return (
      <div className={cn("relative h-10 w-10", className)}>
        <Image src="/shinhanlife-ai-mark.svg" alt="Shinhan Life AI Portal" fill className="object-contain object-left" />
      </div>
    )
  }

  return (
    <div className={cn("relative h-14 w-[220px]", className)}>
      <Image src="/shinhanlife-ai-signature.svg" alt="Shinhan Life AI Portal" fill className="object-contain object-left" />
    </div>
  )
}
