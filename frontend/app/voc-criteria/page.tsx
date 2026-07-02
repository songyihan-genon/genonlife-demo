import { ComplaintDetectionView } from "@/components/ComplaintDetectionView"

// AI 평가 기준 — VoC AI 분류·평가 기준 설정 (단독 화면)
export default function VocCriteriaPage() {
  return (
    <ComplaintDetectionView
      tabs={["criteria"]}
      initialTab="criteria"
      title="AI 평가 기준"
      sub="VoC AI 분류·위험도 평가 기준 설정"
    />
  )
}
