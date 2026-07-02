import { PotentialDetectTabs } from "@/components/PotentialDetectTabs"
import { ComplaintDetectionView } from "@/components/ComplaintDetectionView"

// 잠재민원탐지 > VoC 분석 — 전사 통합 분석(전체 대시보드 탭 결합본)
export default function VocAnalysisCopyPage() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PotentialDetectTabs />
      <div className="min-h-0 flex-1">
        <ComplaintDetectionView tabs={["analysis"]} initialTab="analysis" analysisFullTabs title="VoC 통합 분석" sub="콜·이메일·대외기관 문의 통합 분석" />
      </div>
    </div>
  )
}
