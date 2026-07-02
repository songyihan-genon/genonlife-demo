import { PotentialDetectTabs } from "@/components/PotentialDetectTabs"
import { ComplaintDetectionView } from "@/components/ComplaintDetectionView"

// 복사본 — VoC 통합관리의 '고객 민원 탐지' 화면
export default function VocDetectCopyPage() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PotentialDetectTabs />
      <div className="min-h-0 flex-1">
        <ComplaintDetectionView initialTab="detect" />
      </div>
    </div>
  )
}
