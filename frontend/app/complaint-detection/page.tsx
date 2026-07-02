import { ComplaintDetectionView } from "@/components/ComplaintDetectionView"

// VoC 통합 관리 — VoC 통합 분석 단일 화면(세부 탭 없음)
export default function ComplaintDetectionPage() {
  return (
    <ComplaintDetectionView
      tabs={["analysis"]}
      initialTab="analysis"
      title="민원 탐지·이관"
      sub="콜·이메일·대외기관 문의 통합 탐지 → 유형 분류 → 담당 부서 이관"
    />
  )
}
