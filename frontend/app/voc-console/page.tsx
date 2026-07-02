import { ComplaintDetectionView } from "@/components/ComplaintDetectionView"

// VoC 애널리틱스 — 이슈 모니터링 · 통계 대시보드 · VoC 리포트
export default function VocConsolePage() {
  return (
    <ComplaintDetectionView
      tabs={["monitor", "statsboard", "report"]}
      initialTab="monitor"
      title="VoC 애널리틱스"
      sub="실시간 이슈 모니터링 · 통계 대시보드 · VoC 리포트"
    />
  )
}
