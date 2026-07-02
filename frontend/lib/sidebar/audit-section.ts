import { ShieldCheck, ClipboardCheck } from "lucide-react"

export function getAuditSection(pathname: string | null, mode: string | null) {
  const onAudit = pathname === "/audit"
  const activeMode = mode === "work" ? "work" : "guidance"
  return {
    title: "후처리 검수 Agent",
    titleIcon: ShieldCheck,
    items: [
      {
        name: "안내검수",
        href: "/audit?mode=guidance",
        icon: ShieldCheck,
        isActive: onAudit && activeMode === "guidance",
      },
      {
        name: "업무검수",
        href: "/audit?mode=work",
        icon: ClipboardCheck,
        isActive: onAudit && activeMode === "work",
      },
    ],
  }
}
