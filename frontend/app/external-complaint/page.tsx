import { ComplaintDetectionView } from "@/components/ComplaintDetectionView"

// 대외기관 민원 처리 — 민원 처리(회신) 단일 화면(세부 탭 없음)
export default function ExternalComplaintPage() {
  return (
    <ComplaintDetectionView
      tabs={["reply"]}
      initialTab="reply"
      title="대외기관 민원 처리"
      sub="금융감독원 등 대외기관 민원 회신 초안 작성·처리"
    />
  )
}
