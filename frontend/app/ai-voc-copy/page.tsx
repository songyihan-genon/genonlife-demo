import { PotentialDetectTabs } from "@/components/PotentialDetectTabs"
import { VocServiceView } from "@/components/VocServiceView"

// 복사본 — AI VoC 서비스(콜상담 VoC) 화면
export default function AiVocCopyPage() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PotentialDetectTabs />
      <div className="min-h-0 flex-1">
        <VocServiceView />
      </div>
    </div>
  )
}
